import { getPostsByCategory, getAllCategories } from "@/lib/posts";
import { notFound } from "next/navigation";
import PostCard from "@/components/PostCard";
import Link from "next/link";

interface Props {
  params: Promise<{ cat: string }>;
}

export async function generateStaticParams() {
  const categories = getAllCategories();
  return categories.map((cat) => ({ cat }));
}

export default async function CategoryPage({ params }: Props) {
  const { cat } = await params;
  const decodedCat = decodeURIComponent(cat);
  const posts = getPostsByCategory(decodedCat);

  if (posts.length === 0) notFound();

  const categoryEmoji: Record<string, string> = { 테크: "💻", 라이프스타일: "🌿" };
  const emoji = categoryEmoji[decodedCat] ?? "📦";

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/" className="text-gray-400 hover:text-red-600 transition-colors text-sm">← 전체</Link>
        <h1 className="text-2xl font-extrabold text-gray-900">{emoji} {decodedCat}</h1>
        <span className="text-sm text-gray-400">{posts.length}개 상품</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => <PostCard key={post.slug} post={post} />)}
      </div>
    </div>
  );
}
