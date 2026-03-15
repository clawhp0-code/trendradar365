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
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
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
    if (saved) {
      setGhToken(saved);
      setTokenSaved(true);
    }
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (username === ADMIN_USERNAME && pw === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
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

  async function loadPosts() {
    if (!ghToken) {
      alert("GitHub Token을 먼저 저장해주세요!");
      return;
    }
    setLoadingPosts(true);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/content/posts`,
        {
          headers: { Authorization: `token ${ghToken}` },
        }
      );
      if (!res.ok) throw new Error("Failed to load posts");
      const files = await res.json();
      const postList = await Promise.all(
        files
          .filter((f: any) => f.name.endsWith(".md"))
          .map(async (f: any) => {
            const content = await fetch(f.url, {
              headers: { Authorization: `token ${ghToken}`, Accept: "application/vnd.github.v3.raw" },
            }).then((r) => r.text());
            const titleMatch = content.match(/^title: "(.+?)"$/m);
            const dateMatch = content.match(/^date: "(.+?)"$/m);
            return {
              name: f.name,
              path: f.path,
              title: titleMatch ? titleMatch[1] : f.name,
              date: dateMatch ? dateMatch[1] : "N/A",
            };
          })
      );
      setPosts(postList.reverse());
      setMode("list");
    } catch (err) {
      alert("포스트 로드 실패");
    } finally {
      setLoadingPosts(false);
    }
  }

  async function loadPostForEdit(post: Post) {
    if (!ghToken) return;
    setLoadingPosts(true);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${post.path}`,
        {
          headers: { Authorization: `token ${ghToken}`, Accept: "application/vnd.github.v3.raw" },
        }
      );
      if (!res.ok) throw new Error("Failed to load post");
      const content = await res.text();
      const lines = content.split("\n");
      const endIdx = lines.indexOf("---", 1);
      const frontmatter = lines.slice(1, endIdx).join("\n");
      const body = lines.slice(endIdx + 1).join("\n").trim();

      const extract = (key: string) => {
        const m = frontmatter.match(new RegExp(`^${key}: "(.+?)"$`, "m"));
        return m ? m[1].replace(/\\"/g, '"') : "";
      };

      setForm({
        title: extract("title"),
        category: extract("category") || "테크",
        thumbnail: extract("thumbnail"),
        price: extract("price"),
        productCode: extract("productCode"),
        releaseDate: extract("releaseDate"),
        buyLink: extract("buyLink"),
        summary: extract("summary"),
        content: body,
      });
      setSelectedPost(post);
      setMode("edit");
    } catch (err) {
      alert("포스트 로드 실패");
    } finally {
      setLoadingPosts(false);
    }
  }

  async function deletePost(post: Post) {
    if (!window.confirm(`"${post.title}"을(를) 정말 삭제하시겠습니까?`)) return;
    if (!ghToken) return;

    setSubmitting(true);
    try {
      const fileRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${post.path}`,
        { headers: { Authorization: `token ${ghToken}` } }
      );
      const fileData = await fileRes.json();
      const sha = fileData.sha;

      const res = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${post.path}`,
        {
          method: "DELETE",
          headers: { Authorization: `token ${ghToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `🗑️ 포스팅 삭제: ${post.title}`,
            sha,
          }),
        }
      );
      if (res.ok) {
        setResult({ ok: true, message: `✅ "${post.title}" 삭제 완료!` });
        loadPosts();
      } else {
        setResult({ ok: false, message: "❌ 삭제 실패" });
      }
    } catch (err) {
      setResult({ ok: false, message: "❌ 오류 발생" });
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ghToken) {
      alert("GitHub Token을 먼저 저장해주세요!");
      return;
    }
    setSubmitting(true);
    setResult(null);

    try {
      const slug = selectedPost
        ? selectedPost.name.replace(/\.md$/, "")
        : `${today}-${slugify(form.title) || "untitled"}`;
      const filename = `content/posts/${slug}.md`;

      const lines = [
        "---",
        `title: "${form.title.replace(/"/g, "'")}"`,
        `date: "${selectedPost ? selectedPost.date : today}"`,
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

      let sha: string | undefined;
      if (selectedPost) {
        const fileRes = await fetch(
          `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filename}`,
          { headers: { Authorization: `token ${ghToken}` } }
        );
        if (fileRes.ok) {
          const fileData = await fileRes.json();
          sha = fileData.sha;
        }
      }

      const res = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filename}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${ghToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `${selectedPost ? "✏️ 포스팅 수정" : "📝 수동 포스팅"}: ${form.title}`,
            content: encoded,
            ...(sha && { sha }),
          }),
        }
      );

      if (res.ok) {
        setResult({
          ok: true,
          message: `✅ "${form.title}" ${selectedPost ? "수정" : "포스팅"} 완료! 약 2-3분 후 반영됩니다.`,
        });
        setForm({
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
        setSelectedPost(null);
        setMode("create");
      } else {
        const err = await res.json();
        setResult({ ok: false, message: `❌ 오류: ${err.message}` });
      }
    } catch (err) {
      setResult({ ok: false, message: "❌ 네트워크 오류" });
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
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="사용자 이름"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
          />
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호 입력"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
          />
          {pwError && <p className="text-red-500 text-sm mb-3">❌ 사용자 이름 또는 비밀번호가 틀렸습니다.</p>}
          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
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
          <h1 className="text-3xl font-extrabold text-gray-900">✍️ 포스팅 관리</h1>
          <p className="text-gray-400 text-sm mt-1">TrendRadar 365 관리자 대시보드</p>
        </div>
        <a href="/" className="text-sm text-gray-400 hover:text-red-600 transition-colors">
          ← 홈으로
        </a>
      </div>

      {/* GitHub Token 설정 */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
        <h2 className="font-bold text-blue-800 mb-2">🔑 GitHub Token</h2>
        {tokenSaved ? (
          <div className="flex items-center gap-3">
            <span className="text-green-600 text-sm font-medium">✅ 저장됨 (로컬)</span>
            <button onClick={clearToken} className="text-red-500 text-sm underline">
              삭제
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="사용자 이름"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
          />
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호 입력"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
          />
          {pwError && <p className="text-red-500 text-sm mb-3">❌ 사용자 이름 또는 비밀번호가 틀렸습니다.</p>}
