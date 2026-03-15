import { supabase } from "@/lib/supabase";
import PostCard from "@/components/PostCard";

export const revalidate = 60;

export default async function HomePage() {
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(20);

  const featured = posts?.[0];
  const rest = posts?.slice(1) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Featured post */}
      {featured && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-black uppercase tracking-widest text-red-600">FEATURED</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <PostCard post={featured} featured />
        </section>
      )}

      {/* Latest posts grid */}
      {rest.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-black uppercase tracking-widest text-gray-900">LATEST</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {(!posts || posts.length === 0) && (
        <div className="text-center py-32 text-gray-400">
          <div className="text-6xl mb-4">📡</div>
          <p className="font-bold text-xl">트렌드를 수집 중입니다...</p>
        </div>
      )}
    </div>
  );
}
