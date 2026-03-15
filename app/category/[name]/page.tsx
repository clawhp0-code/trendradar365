import { supabase } from "@/lib/supabase";
import PostCard from "@/components/PostCard";
import Link from "next/link";

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const category = decodeURIComponent(name);

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("category", category)
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-10">
        <Link href="/" className="text-sm text-gray-400 hover:text-red-600 transition-colors">← 전체</Link>
        <h1 className="text-3xl font-black text-gray-900 mt-2">
          <span className="text-red-600">#</span> {category}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{posts?.length ?? 0}개의 포스트</p>
      </div>

      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-32 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-bold">아직 포스트가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
