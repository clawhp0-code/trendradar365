"use client";

import { useState, useEffect } from "react";

const ADMIN_PASSWORD = "trendradar2026!";
const REPO_OWNER = "clawhp0-code";
const REPO_NAME = "trendradar365";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [ghToken, setGhToken] = useState("");
  const [tokenSaved, setTokenSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [form, setForm] = useState({
    title: "",
    category: "테크",
    thumbnail: "",
    price: "",
    productCode: "",
    releaseDate: "",
    buyLink: "",
    summary: "",
    content: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("gh_token");
    if (saved) { setGhToken(saved); setTokenSaved(true); }
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false); }
    else { setPwError(true); }
  }

  function saveToken() {
    localStorage.setItem("gh_token", ghToken);
    setTokenSaved(true);
  }

  function clearToken() {
    localStorage.removeItem("gh_token");
    setGhToken("");
    setTokenSaved(false);
  }

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ghToken) { alert("GitHub Token을 먼저 저장해주세요!"); return; }
    setSubmitting(true);
    setResult(null);

    const slug = `${today}-${slugify(form.title) || "untitled"}`;
    const filename = `content/posts/${slug}.md`;

    const lines = [
      "---",
      `title: "${form.title.replace(/"/g, "'")}"`,
      `date: "${today}"`,
      `category: "${form.category}"`,
      ...(form.thumbnail ? [`thumbnail: "${form.thumbnail}"`] : []),
      ...(form.price ? [`price: "${form.price}"`] : []),
      ...(form.productCode ? [`productCode: "${form.productCode}"`] : []),
      ...(form.releaseDate ? [`releaseDate: "${form.releaseDate}"`] : []),
      ...(form.buyLink ? [`buyLink: "${form.buyLink}"`] : []),
      `summary: "${form.summary.replace(/"/g, "'")}"`,
      "---",
      "",
      form.content,
    ];

    const content = lines.join("\n");
    const encoded = btoa(unescape(encodeURIComponent(content)));

    try {
      const res = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filename}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${ghToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `📝 수동 포스팅: ${form.title}`,
            content: encoded,
          }),
        }
      );

      if (res.ok) {
        setResult({ ok: true, message: `✅ "${form.title}" 포스팅 완료! 약 2-3분 후 trendradar365.com에 반영됩니다.` });
        setForm({ title: "", category: "테크", thumbnail: "", price: "", productCode: "", releaseDate: "", buyLink: "", summary: "", content: "" });
      } else {
        const err = await res.json();
        setResult({ ok: false, message: `❌ 오류: ${err.message}` });
      }
    } catch (err) {
      setResult({ ok: false, message: `❌ 네트워크 오류가 발생했습니다.` });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Login Screen ──────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900">관리자 로그인</h1>
            <p className="text-sm text-gray-400 mt-1">TrendRadar 365 Admin</p>
          </div>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="비밀번호 입력"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
          />
          {pwError && <p className="text-red-500 text-sm mb-3">❌ 비밀번호가 틀렸습니다.</p>}
          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors">
            로그인
          </button>
        </form>
      </div>
    );
  }

  // ── Admin Dashboard ───────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">✍️ 직접 포스팅</h1>
          <p className="text-gray-400 text-sm mt-1">TrendRadar 365 관리자 대시보드</p>
        </div>
        <a href="/" className="text-sm text-gray-400 hover:text-red-600 transition-colors">← 홈으로</a>
      </div>

      {/* GitHub Token 설정 */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
        <h2 className="font-bold text-blue-800 mb-2">🔑 GitHub Token</h2>
        {tokenSaved ? (
          <div className="flex items-center gap-3">
            <span className="text-green-600 text-sm font-medium">✅ 저장됨 (로컬)</span>
            <button onClick={clearToken} className="text-red-500 text-sm underline">삭제</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="password"
              value={ghToken}
              onChange={e => setGhToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="flex-1 border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button onClick={saveToken} className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">
              저장
            </button>
          </div>
        )}
        <p className="text-xs text-blue-500 mt-2">github.com → Settings → Developer settings → Personal access tokens → repo 권한</p>
      </div>

      {/* Result Message */}
      {result && (
        <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${result.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {result.message}
        </div>
      )}

      {/* Post Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">제목 *</label>
          <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="예: 삼성 갤럭시 S25 Ultra — 가장 강력한 AI 스마트폰"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">카테고리 *</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
            <option value="테크">💻 테크</option>
            <option value="라이프스타일">🌿 라이프스타일</option>
          </select>
        </div>

        {/* Thumbnail */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">썸네일 URL</label>
          <input value={form.thumbnail} onChange={e => setForm(p => ({ ...p, thumbnail: e.target.value }))}
            placeholder="https://images.unsplash.com/photo-XXXX?w=800"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>

        {/* Price / Product Code / Release Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">가격</label>
            <input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
              placeholder="₩999,000"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">제품 코드</label>
            <input value={form.productCode} onChange={e => setForm(p => ({ ...p, productCode: e.target.value }))}
              placeholder="SM-S928N"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">출시일</label>
            <input type="date" value={form.releaseDate} onChange={e => setForm(p => ({ ...p, releaseDate: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
        </div>

        {/* Buy Link */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">구매 링크</label>
          <input value={form.buyLink} onChange={e => setForm(p => ({ ...p, buyLink: e.target.value }))}
            placeholder="https://samsung.com/kr/..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>

        {/* Summary */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">한 줄 요약 *</label>
          <input required value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))}
            placeholder="이 제품의 핵심을 2-3문장으로 요약해주세요."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">본문 (마크다운) *</label>
          <textarea required value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            placeholder="## 상세 설명&#10;&#10;마크다운 형식으로 작성하세요.&#10;이모지도 자유롭게 사용할 수 있어요! 🚀"
            rows={10}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400 resize-y" />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition-colors text-base shadow-sm">
          {submitting ? "⏳ 포스팅 중..." : "🚀 지금 포스팅하기!"}
        </button>

        <p className="text-center text-xs text-gray-400">
          포스팅 후 약 2-3분 내에 www.trendradar365.com에 자동 반영됩니다.
        </p>
      </form>
    </div>
  );
}
