#!/usr/bin/env python3
"""
trendradar365 이미지 처리 + 포스팅 업로드 스크립트
사용법: python3 auto_post.py --product '{JSON}' --product '{JSON}' ...
AI(트렌딩 탐색, 콘텐츠 생성)는 Claude Code 크론이 담당하고,
이 스크립트는 이미지 처리 + Supabase 업로드만 담당.
"""

import os
import re
import sys
import json
import time
import argparse
import requests
from io import BytesIO
from pathlib import Path
from datetime import datetime, timezone
from slugify import slugify

from PIL import Image
import numpy as np

# ─── 설정 ───────────────────────────────────────────────
SUPABASE_URL = "https://oagowvuvgadyyhxxojce.supabase.co"
SUPABASE_KEY = "sb_publishable_D1fCiakpxjzNVD7K-zPTgA_Vq6aTPZK"
STORAGE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
}
REST_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}
TMP_DIR = Path("/tmp/trendradar")
TMP_DIR.mkdir(exist_ok=True)


# ─── 이미지 다운로드 ─────────────────────────────────────
def download_image(url: str, name: str) -> Path | None:
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
    }
    try:
        r = requests.get(url, headers=headers, timeout=25, stream=True)
        r.raise_for_status()
        content_type = r.headers.get("content-type", "")
        ext = "png" if "png" in content_type else "jpg"
        path = TMP_DIR / f"{slugify(name)}_raw.{ext}"
        with open(path, "wb") as f:
            for chunk in r.iter_content(8192):
                f.write(chunk)
        img = Image.open(path)
        w, h = img.size
        if w < 150 or h < 150:
            print(f"  [!] 이미지 너무 작음 {w}x{h}")
            return None
        print(f"  [✓] 이미지 다운로드: {w}x{h}")
        return path
    except Exception as e:
        print(f"  [!] 다운로드 실패: {e}")
        return None


# ─── 이미지 처리 ─────────────────────────────────────────
def process_image(raw_path: Path, product_name: str) -> Path:
    from rembg import remove

    print("  [→] 배경 제거 중...")
    with open(raw_path, "rb") as f:
        raw_data = f.read()
    nobg_data = remove(raw_data)

    img = Image.open(BytesIO(nobg_data)).convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    h, w = arr.shape[:2]

    # 워터마크 제거: 상단 우측 코너 소형 아이콘
    region = arr[: int(h * 0.22), int(w * 0.72) :, :]
    r_ch, g_ch, b_ch, a_ch = region[:, :, 0], region[:, :, 1], region[:, :, 2], region[:, :, 3]
    max_rgb = np.maximum(np.maximum(r_ch, g_ch), b_ch)
    min_rgb = np.minimum(np.minimum(r_ch, g_ch), b_ch)
    saturation = np.where(max_rgb > 0, (max_rgb - min_rgb) / max_rgb, 0)
    wm_mask = (saturation > 0.35) & (a_ch > 40)
    if wm_mask.sum() < 4000:
        arr[: int(h * 0.22), int(w * 0.72) :, :][wm_mask] = [0, 0, 0, 0]

    img_clean = Image.fromarray(arr.astype(np.uint8))

    # 4도 회전 (시점 변화)
    rotated = img_clean.rotate(-4, expand=True, resample=Image.BICUBIC)

    # 1200x630 썸네일 캔버스 (크림 그라디언트)
    cw, ch = 1200, 630
    canvas_arr = np.zeros((ch, cw, 4), dtype=np.float32)
    for x in range(cw):
        t = x / cw
        canvas_arr[:, x, :] = [int(252 - t * 18), int(246 - t * 28), int(240 - t * 28), 255]
    canvas = Image.fromarray(canvas_arr.astype(np.uint8))

    ph = int(ch * 0.90)
    pw = int(ph * rotated.width / rotated.height)
    product_img = rotated.resize((pw, ph), Image.LANCZOS)
    px = int(cw * 0.52 - pw // 2)
    py = int((ch - ph) // 2)
    canvas.paste(product_img, (px, py), product_img)

    out = TMP_DIR / f"{slugify(product_name)}_thumb.jpg"
    canvas.convert("RGB").save(out, "JPEG", quality=93)
    print(f"  [✓] 썸네일 생성 완료")
    return out


# ─── Supabase 업로드 ─────────────────────────────────────
def upload_thumbnail(thumb_path: Path, product_name: str) -> str:
    storage_path = f"thumbnails/auto_{int(time.time())}_{slugify(product_name)}.jpg"
    with open(thumb_path, "rb") as f:
        data = f.read()
    resp = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/images/{storage_path}",
        headers={**STORAGE_HEADERS, "Content-Type": "image/jpeg", "x-upsert": "true"},
        data=data,
        timeout=30,
    )
    resp.raise_for_status()
    url = f"{SUPABASE_URL}/storage/v1/object/public/images/{storage_path}"
    print(f"  [✓] 이미지 업로드 완료")
    return url


def make_unique_slug(base_slug: str) -> str:
    for i in range(10):
        slug = base_slug if i == 0 else f"{base_slug}-{i}"
        check = requests.get(
            f"{SUPABASE_URL}/rest/v1/posts?slug=eq.{slug}&select=id",
            headers=REST_HEADERS,
        ).json()
        if not check:
            return slug
    return f"{base_slug}-{int(time.time())}"


def create_post(post_data: dict) -> str:
    today = datetime.now().strftime("%Y-%m-%d")
    slug_base = slugify(f"{today} {post_data.get('slug_hint', post_data['title'][:40])}")
    post_data["slug"] = make_unique_slug(slug_base)

    # published_at: 오늘 오후 8시 UTC
    now = datetime.now()
    pub = now.replace(hour=20, minute=0, second=0, microsecond=0)
    post_data["published_at"] = pub.astimezone(timezone.utc).isoformat()

    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/posts",
        headers=REST_HEADERS,
        json=post_data,
        timeout=15,
    )
    resp.raise_for_status()
    result = resp.json()
    post_id = result[0]["id"] if isinstance(result, list) else result["id"]
    print(f"  [✓] 포스팅 완료: {post_data['title']}")
    return post_id


# ─── 메인 ───────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--product", action="append", required=True, help="JSON 형식 제품 데이터")
    args = parser.parse_args()

    results = []
    for i, raw in enumerate(args.product, 1):
        try:
            p = json.loads(raw)
        except json.JSONDecodeError as e:
            print(f"[{i}] JSON 파싱 오류: {e}")
            continue

        print(f"\n[{i}] {p.get('title', '?')}")

        # 이미지 처리
        thumbnail_url = p.get("thumbnail_url")
        if p.get("image_url") and not thumbnail_url:
            raw_img = download_image(p["image_url"], p.get("product_name", f"product{i}"))
            if raw_img:
                try:
                    thumb = process_image(raw_img, p.get("product_name", f"product{i}"))
                    thumbnail_url = upload_thumbnail(thumb, p.get("product_name", f"product{i}"))
                except Exception as e:
                    print(f"  [!] 이미지 처리 실패: {e}")

        # 포스팅 데이터 구성
        post = {
            "title": p["title"],
            "category": p.get("category", "테크"),
            "thumbnail": thumbnail_url,
            "summary": p.get("summary", ""),
            "content": p.get("content", ""),
            "price": p.get("price"),
            "buy_link": p.get("buy_link"),
            "release_date": p.get("release_date"),
            "slug_hint": p.get("product_name", ""),
        }

        try:
            post_id = create_post(post)
            results.append({"product": p.get("title"), "id": post_id, "status": "ok"})
        except Exception as e:
            print(f"  [✗] 포스팅 실패: {e}")
            results.append({"product": p.get("title"), "status": "fail", "error": str(e)})

    print(f"\n[완료] {sum(1 for r in results if r['status']=='ok')}/{len(results)}개 성공")
    print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
