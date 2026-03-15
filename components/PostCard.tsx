import Link from "next/link";
import Image from "next/image";
import { Post } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

export default function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  if (featured) {
    return (
      <Link href={`/posts/${post.slug}`} className="group block">
        <article className="relative overflow-hidden rounded-2xl bg-gray-900 aspect-[16/9]">
          {post.thumbnail ? (
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              className="object-cover opacity-70 group-hover:opacity-50 transition-opacity duration-300"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-red-900 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
              {post.category}
            </span>
            <h2 className="text-white text-2xl sm:text-3xl font-black leading-tight mb-2 group-hover:text-red-300 transition-colors">
              {post.title}
            </h2>
            <p className="text-gray-300 text-sm line-clamp-2 mb-3">{post.summary}</p>
            <span className="text-gray-500 text-xs">{formatDate(post.published_at)}</span>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/posts/${post.slug}`} className="group block">
      <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {post.thumbnail ? (
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-gray-100 flex items-center justify-center">
              <span className="text-4xl">📦</span>
            </div>
          )}
          <span className="absolute top-3 left-3 bg-black/80 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {post.category}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-black text-gray-900 leading-tight mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
            {post.title}
          </h3>
          <p className="text-gray-500 text-sm line-clamp-2 mb-3">{post.summary}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{formatDate(post.published_at)}</span>
            {post.price && (
              <span className="text-sm font-bold text-red-600">{post.price}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
