import { getPostsByCategory, getAllCategories } from "@/lib/posts";
import PostCard from "@/components/PostCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: { cat: string };
}

export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((cat) => ({ cat: encodeURIComponent(cat) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = decodeURIComponent(params.cat);
  return {
    title: `${cat} 트렌드 제품`,
    description: `${cat} 분야의 최신 트렌드 제품 모음. TrendRadar365에서 큐레이션한 핫한 아이템을 발견하세요.`,
    openGraph: {
      title: `${cat} 트렌드 제품 | TrendRadar365`,
      description: `${cat} 분야의 최신 트렌드 제품 모음.`,
    },
  };
}

const categoryEmoji: Record<string, string> = {
  테크: "💻",
  라이프스타일: "🌿",
};

const VALID_CATEGORIES = ["테크", "라이프스타일"];

export default function CategoryPage({ params }: Props) {
  const cat = decodeURIComponent(params.cat);

  if (!VALID_CATEGORIES.includes(cat)) {
    notFound();
  }

  const posts = getPostsByCategory(cat);
  const emoji = categoryEmoji[cat] ?? "📦";

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/" className="hover:text-red-600 transition-colors">
            홈
          </Link>
          <span>/</span>
          <span className="text-gray-600">
            {emoji} {cat}
          </span>
        </nav>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          {emoji} {cat}
        </h1>
        <p className="text-gray-500">
          {cat} 분야의 최신 트렌드 제품을 만나보세요.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-3 mb-8">
        {VALID_CATEGORIES.map((c) => (
          <Link
            key={c}
            href={`/category/${encodeURIComponent(c)}`}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              c === cat
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
            }`}
          >
            {categoryEmoji[c]} {c}
          </Link>
        ))}
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-lg">아직 {cat} 카테고리에 게시글이 없습니다.</p>
          <p className="text-sm mt-1">곧 새로운 트렌드 제품이 업데이트됩니다!</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-400">{posts.length}개 상품</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
