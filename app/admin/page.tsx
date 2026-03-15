"use client";

import { useState, useEffect } from "react";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "trendradar2026!";
const REPO_OWNER = "clawhp0-code";
const REPO_NAME = "trendradar365";

interface Post {
  name: string;
  path: string;
  title: string;
  date: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9가-힣\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);
  const [ghToken, setGhToken] = useState("");
  const [tokenSaved, setTokenSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [mode, setMode] = useState<"create" | "list" | "edit">("create");
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [currentSha, setCurrentSha] = useState<string>("");
  const [form, setForm] = useState({
    title: "", category: "테크", thumbnail: "", price: "", productCode: "", releaseDate: "", buyLink: "", summary: "", content: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("gh_token");
    if (saved) { setGhToken(saved); setTokenSaved(true); }
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (username === ADMIN_USERNAME && pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false); }
    else { setPwError(true); }
  }

  function saveToken() { localStorage.setItem("gh_token", ghToken); setTokenSaved(true); }
  function clearToken() { localStorage.removeItem("gh_token"); setGhToken(""); setTokenSaved(false); }

  async function loadPosts() {
    if (!ghToken) { alert("GitHub Token을 먼저 저장해주세요!"); return; }
    setLoadingPosts(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/content/posts`, { headers: { Authorization: `token ${ghToken}` } });
      if (!res.ok) throw new Error("Failed");
      const files = await res.json();
      const postList = await Promise.all(files.filter((f: any) => f.name.endsWith(".md")).map(async (f: any) => {
        const content = await fetch(f.url, { headers: { Authorization: `token ${ghToken}`, Accept: "application/vnd.github.v3.raw" } }).then((r) => r.text());
        const titleMatch = content.match(/^title: "(.+?)"$/m);
        const dateMatch = content.match(/^date: "(.+?)"$/m);
        return { name: f.name, path: f.path, title: titleMatch ? titleMatch[1] : f.name, date: dateMatch ? dateMatch[1] : "N/A" };
      }));
      setPosts(postList.reverse());
      setMode("list");
    } catch (err: any) { console.error("Load Error:", err); alert("포스트 로드 실패: " + (err?.message || String(err))); }
    finally { setLoadingPosts(false); }
  }

  async function loadPostForEdit(post: Post) {
    if (!ghToken) return;
    setLoadingPosts(true);
    try {
      // Fetch JSON (not raw) so we can get the SHA
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${post.path}`, { headers: { Authorization: `token ${ghToken}`, Accept: "application/vnd.github+json" }, cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const fileData = await res.json();
      setCurrentSha(fileData.sha); // Save SHA for later PUT request
      // Decode base64 content
      const rawContent = decodeURIComponent(escape(atob(fileData.content.replace(/\n/g, ""))));
      const lines = rawContent.split("\n");
      const endIdx = lines.indexOf("---", 1);
      const frontmatter = lines.slice(1, endIdx).join("\n");
      const body = lines.slice(endIdx + 1).join("\n").trim();
      const extract = (key: string) => { const m = frontmatter.match(new RegExp(`^${key}: "(.+?)"$`, "m")); return m ? m[1].replace(/\\"/g, '"') : ""; };
      setForm({
        title: extract("title"), category: extract("category") || "테크", thumbnail: extract("thumbnail"), price: extract("price"), productCode: extract("productCode"), releaseDate: extract("releaseDate"), buyLink: extract("buyLink"), summary: extract("summary"), content: body,
      });
      setSelectedPost(post);
      setMode("edit");
    } catch (err: any) { console.error("Load Error:", err); alert("포스트 로드 실패: " + (err?.message || String(err))); }
    finally { setLoadingPosts(false); }
  }

  async function deletePost(post: Post) {
    if (!window.confirm(`"${post.title}"을(를) 정말 삭제하시겠습니까?`)) return;
    if (!ghToken) return;
    setSubmitting(true);
    try {
      const fileRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${post.path}`, { headers: { Authorization: `token ${ghToken}`, Accept: "application/vnd.github+json" } });
      if (!fileRes.ok) throw new Error(`SHA 조회 실패: ${fileRes.status}`);
      const fileData = await fileRes.json();
      if (!fileData.sha) throw new Error("SHA를 가져올 수 없습니다.");
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${post.path}`, {
        method: "DELETE", headers: { Authorization: `token ${ghToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: `🗑️ 포스팅 삭제: ${post.title}`, sha: fileData.sha }),
      });
      if (res.ok) { setResult({ ok: true, message: `✅ "${post.title}" 삭제 완료!` }); loadPosts(); }
      else { const err = await res.json(); setResult({ ok: false, message: `❌ 삭제 실패: ${err.message}` }); }
    } catch (err: any) { console.error("Delete Error:", err); setResult({ ok: false, message: `❌ 오류: ${err?.message || String(err)}` }); }
    finally { setSubmitting(false); }
  }

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ghToken) { alert("GitHub Token을 먼저 저장해주세요!"); return; }
    setSubmitting(true);
    setResult(null);
    try {
      const slug = selectedPost ? selectedPost.name.replace(/\.md$/, "") : `${today}-${slugify(form.title) || "untitled"}`;
      const filename = `content/posts/${slug}.md`;
      const lines = ["---", `title: "${form.title.replace(/"/g, "'")}"`, `date: "${selectedPost ? selectedPost.date : today}"`, `category: "${form.category}"`, ...(form.thumbnail ? [`thumbnail: "${form.thumbnail}"`] : []), ...(form.price ? [`price: "${form.price}"`] : []), ...(form.productCode ? [`productCode: "${form.productCode}"`] : []), ...(form.releaseDate ? [`releaseDate: "${form.releaseDate}"`] : []), ...(form.buyLink ? [`buyLink: "${form.buyLink}"`] : []), `summary: "${form.summary.replace(/"/g, "'")}"`, "---", "", form.content];
      const content = lines.join("\n");
      const encoded = btoa(unescape(encodeURIComponent(content)));
      // Use SHA saved during loadPostForEdit (no extra API call needed!)
      const sha: string | undefined = (selectedPost && currentSha) ? currentSha : undefined;
      if (selectedPost && !sha) throw new Error("수정에 필요한 SHA가 없습니다. 포스팅 목록을 새로고침 후 다시 시도해주세요.");
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filename}`, {
        method: "PUT", headers: { Authorization: `token ${ghToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ message: `${selectedPost ? "✏️ 포스팅 수정" : "📝 수동 포스팅"}: ${form.title}`, content: encoded, ...(sha ? { sha } : {}) }),
      });
      if (res.ok) {
        setResult({ ok: true, message: `✅ "${form.title}" ${selectedPost ? "수정" : "포스팅"} 완료! 약 2-3분 후 반영됩니다.` });
        setForm({ title: "", category: "테크", thumbnail: "", price: "", productCode: "", releaseDate: "", buyLink: "", summary: "", content: "" });
        setSelectedPost(null);
        setMode("create");
      } else { const err = await res.json(); setResult({ ok: false, message: `❌ 오류: ${err.message}` }); }
    } catch (err: any) { console.error("Admin Error:", err); setResult({ ok: false, message: `❌ 오류: ${err?.message || String(err)}` }); }
    finally { setSubmitting(false); }
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
          <div className="text-center mb-6"><div className="text-4xl mb-2">🔐</div><h1 className="text-2xl font-bold text-gray-900">관리자 로그인</h1><p className="text-sm text-gray-400 mt-1">TrendRadar 365 Admin</p></div>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="사용자 이름" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-3" />
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-3" />
          {pwError && <p className="text-red-500 text-sm mb-3">❌ 사용자 이름 또는 비밀번호가 틀렸습니다.</p>}
          <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors">로그인</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8"><div><h1 className="text-3xl font-extrabold text-gray-900">✍️ 포스팅 관리</h1><p className="text-gray-400 text-sm mt-1">TrendRadar 365 관리자 대시보드</p></div><a href="/" className="text-sm text-gray-400 hover:text-red-600 transition-colors">← 홈으로</a></div>
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6"><h2 className="font-bold text-blue-800 mb-2">🔑 GitHub Token</h2>{tokenSaved ? (<div className="flex items-center gap-3"><span className="text-green-600 text-sm font-medium">✅ 저장됨</span><button onClick={clearToken} className="text-red-500 text-sm underline">삭제</button></div>) : (<div className="flex gap-2"><input type="password" value={ghToken} onChange={(e) => setGhToken(e.target.value)} placeholder="ghp_xxxxxxxxxxxx" className="flex-1 border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" /><button onClick={saveToken} className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors">저장</button></div>)}</div>
      <div className="flex gap-2 mb-6 border-b border-gray-200"><button onClick={() => { setMode("create"); setSelectedPost(null); setForm({ title: "", category: "테크", thumbnail: "", price: "", productCode: "", releaseDate: "", buyLink: "", summary: "", content: "" }); }} className={`px-4 py-2 font-bold ${mode === "create" ? "text-red-600 border-b-2 border-red-600" : "text-gray-400"}`}>✍️ 새 포스팅</button><button onClick={loadPosts} className={`px-4 py-2 font-bold ${mode === "list" || mode === "edit" ? "text-red-600 border-b-2 border-red-600" : "text-gray-400"}`}>📋 기존 포스팅</button></div>
      {result && (<div className={`p-4 rounded-xl mb-6 text-sm font-medium ${result.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{result.message}</div>)}
      {mode === "list" && (<div>{loadingPosts ? (<p className="text-center text-gray-400">⏳ 로드 중...</p>) : posts.length === 0 ? (<p className="text-center text-gray-400">포스팅이 없습니다.</p>) : (<div className="space-y-2">{posts.map((post) => (<div key={post.name} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md"><div><p className="font-bold text-gray-900">{post.title}</p><p className="text-xs text-gray-400">{post.date}</p></div><div className="flex gap-2"><button onClick={() => loadPostForEdit(post)} className="bg-blue-600 text-white text-sm font-bold px-3 py-2 rounded-lg hover:bg-blue-700">✏️ 수정</button><button onClick={() => deletePost(post)} disabled={submitting} className="bg-red-600 text-white text-sm font-bold px-3 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-300">🗑️ 삭제</button></div></div>))}</div>)}</div>)}
      {(mode === "create" || (mode === "edit" && selectedPost)) && (<form onSubmit={handleSubmit} className="space-y-4">{mode === "edit" && <div className="bg-purple-50 border border-purple-200 rounded-xl p-4"><p className="text-sm text-purple-700 font-medium">✏️ 수정 중: {selectedPost?.title}</p></div>}<div><label className="block text-sm font-semibold text-gray-700 mb-1">제목 *</label><input required value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-1">카테고리 *</label><select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"><option value="테크">💻 테크</option><option value="라이프스타일">🌿 라이프스타일</option></select></div><div><label className="block text-sm font-semibold text-gray-700 mb-1">썸네일 URL</label><input value={form.thumbnail} onChange={(e) => setForm((p) => ({ ...p, thumbnail: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" /></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><div><label className="block text-sm font-semibold text-gray-700 mb-1">가격</label><input value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} placeholder="₩999,000" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-1">제품 코드</label><input value={form.productCode} onChange={(e) => setForm((p) => ({ ...p, productCode: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-1">출시일</label><input type="date" value={form.releaseDate} onChange={(e) => setForm((p) => ({ ...p, releaseDate: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" /></div></div><div><label className="block text-sm font-semibold text-gray-700 mb-1">구매 링크</label><input value={form.buyLink} onChange={(e) => setForm((p) => ({ ...p, buyLink: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-1">한 줄 요약 *</label><input required value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" /></div><div><label className="block text-sm font-semibold text-gray-700 mb-1">본문 (마크다운) *</label><textarea required value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} rows={10} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400 resize-y" /></div><div className="flex gap-2"><button type="submit" disabled={submitting} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-xl">{submitting ? "⏳ 처리 중..." : mode === "edit" ? "✏️ 수정 완료!" : "🚀 포스팅하기!"}</button>{selectedPost && (<button type="button" onClick={() => { setMode("list"); setSelectedPost(null); }} className="px-6 bg-gray-300 text-gray-800 font-bold rounded-xl">취소</button>)}</div><p className="text-center text-xs text-gray-400">약 2-3분 내에 trendradar365.com에 반영됩니다.</p></form>)}
    </div>
  );
}
