"use client";

import { useState, useEffect, useCallback } from "react";
import { Post } from "@/lib/supabase";

const CATEGORIES = ["테크", "라이프스타일", "뷰티", "푸드", "여행", "Talk"];

const EMPTY_FORM = {
  title: "", category: "테크", thumbnail: "", price: "",
  product_code: "", release_date: "", buy_link: "", summary: "", content: "",
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3000);
  }

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) loadPosts();
  }, [authed, loadPosts]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) { setAuthed(true); setPwError(""); }
    else { setPwError("비밀번호가 틀렸습니다."); }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthed(false);
  }

  function startEdit(post: Post) {
    setEditingPost(post);
    setForm({
      title: post.title,
      category: post.category,
      thumbnail: post.thumbnail ?? "",
      price: post.price ?? "",
      product_code: post.product_code ?? "",
      release_date: post.release_date ?? "",
      buy_link: post.buy_link ?? "",
      summary: post.summary,
      content: post.content,
    });
    setMode("edit");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      title: form.title,
      category: form.category,
      thumbnail: form.thumbnail || null,
      price: form.price || null,
      product_code: form.product_code || null,
      release_date: form.release_date || null,
      buy_link: form.buy_link || null,
      summary: form.summary,
      content: form.content,
    };

    let res: Response;
    if (mode === "edit" && editingPost) {
      res = await fetch(`/api/posts/${editingPost.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      showToast(true, mode === "edit" ? "수정 완료!" : "포스팅 완료!");
      setForm(EMPTY_FORM);
      setEditingPost(null);
      setMode("list");
      loadPosts();
    } else {
      const err = await res.json();
      showToast(false, `오류: ${err.error}`);
    }
    setSubmitting(false);
  }

  async function handleDelete(post: Post) {
    if (!confirm(`"${post.title}"을(를) 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) { showToast(true, "삭제 완료!"); loadPosts(); }
    else showToast(false, "삭제 실패");
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-3xl font-black tracking-tighter mb-1">
              TREND<span className="text-red-600">RADAR</span>
            </div>
            <p className="text-gray-400 text-sm">관리자 로그인</p>
          </div>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
          />
          {pwError && <p className="text-red-500 text-sm mb-3">{pwError}</p>}
          <button type="submit" className="w-full bg-black hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors">
            로그인
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl font-bold text-sm shadow-lg ${toast.ok ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {toast.ok ? "✓" : "✗"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">포스팅 관리</h1>
          <p className="text-gray-400 text-sm mt-0.5">TrendRadar 365</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm text-gray-400 hover:text-red-600">← 홈</a>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-600">로그아웃</button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
        <button
          onClick={() => { setMode("list"); setEditingPost(null); setForm(EMPTY_FORM); }}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${mode === "list" ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-900"}`}
        >
          포스트 목록
        </button>
        <button
          onClick={() => { setMode("create"); setEditingPost(null); setForm(EMPTY_FORM); }}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${mode === "create" || mode === "edit" ? "bg-white text-gray-900 shadow" : "text-gray-500 hover:text-gray-900"}`}
        >
          {mode === "edit" ? "✏️ 수정 중" : "새 포스팅"}
        </button>
      </div>

      {/* Post list */}
      {mode === "list" && (
        <div>
          {loading ? (
            <div className="text-center py-20 text-gray-400">로딩 중...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-5xl mb-3">📭</div>
              <p className="font-bold">포스팅이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <div key={post.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">{post.category}</span>
                      {post.price && <span className="text-xs font-bold text-red-600">{post.price}</span>}
                    </div>
                    <p className="font-bold text-gray-900 truncate">{post.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(post.published_at).toLocaleDateString("ko-KR")}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(post)}
                      className="px-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(post)}
                      className="px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit form */}
      {(mode === "create" || mode === "edit") && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === "edit" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium">
              ✏️ 수정 중: {editingPost?.title}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">제목 *</label>
              <input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">카테고리 *</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">가격</label>
              <input value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="₩99,000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">썸네일 URL</label>
              <input value={form.thumbnail} onChange={(e) => setForm((p) => ({ ...p, thumbnail: e.target.value }))}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">제품 코드</label>
              <input value={form.product_code} onChange={(e) => setForm((p) => ({ ...p, product_code: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">출시일</label>
              <input type="date" value={form.release_date} onChange={(e) => setForm((p) => ({ ...p, release_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">구매 링크</label>
              <input value={form.buy_link} onChange={(e) => setForm((p) => ({ ...p, buy_link: e.target.value }))}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">한 줄 요약 *</label>
              <input required value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">본문 (마크다운) *</label>
              <textarea required value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                rows={14}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400 resize-y" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting}
              className="flex-1 bg-black hover:bg-red-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl transition-colors">
              {submitting ? "처리 중..." : mode === "edit" ? "수정 완료" : "포스팅하기"}
            </button>
            {mode === "edit" && (
              <button type="button"
                onClick={() => { setMode("list"); setEditingPost(null); setForm(EMPTY_FORM); }}
                className="px-8 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                취소
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
