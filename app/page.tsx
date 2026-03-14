import { getAllPosts } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TrendRadar365 — 오늘의 트렌드 제품 큐레이션",
  description:
    "매일 업데이트되는 테크·라이프스타일 트렌드 제품 큐레이션. 지금 가장 핫한 아이템을 발견하세요.",
  openGraph: {
    title: "TrendRadar365 — 오늘의 트렌드 제품 큐레이션",
    description: "매일 업데이트되는 테크·라이프스타일 트렌드 제품 큐레이션.",
    type: "website",
  },
};

export default function HomePage() {
  const posts = getAllPosts().slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-12 mb-10">
        <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 text-sm font-semibold px-4 py-2 rounded-full mb-4 border border-red-100">
          <span className="animate-pulse">🔴</span> 오늘의 트렌드 업데이트
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
          트렌드를 가장 먼저
          <br />
          <span className="text-red-600">TrendRadar365</span>에서
        </h1>
        <p className="text-gray-500 text-lg max-w-md mx-auto">
          매일 AI가 선별한 테크·라이프스타일 트렌드 제품을 만나보세요.
        </p>
      </section>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-lg">아직 게시글이 없습니다.</p>
          <p className="text-sm mt-1">곧 새로운 트렌드 제품이 업데이트됩니다!</p>
        </div>
      ) : (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              🔥 최신 트렌드 제품
            </h2>
            <span className="text-sm text-gray-400">{posts.length}개 상품</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
