import Link from "next/link";
import Image from "next/image";
import { Post } from "@/lib/posts";

const categoryEmoji: Record<string, string> = {
  테크: "💻",
  라이프스타일: "🌿",
};

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const emoji = categoryEmoji[post.category] ?? "📦";

  return (
    <Link href={`/posts/${post.slug}`} className="group block">
      <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 h-full flex flex-col">
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {post.thumbnail ? (
            <Image
              src={post.thumbnail}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-gray-100 to-gray-200">
              {emoji}
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200 text-gray-700">
              {emoji} {post.category}
            </span>
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h2 className="font-bold text-gray-900 text-base leading-snug mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
            {post.title}
          </h2>
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
            {post.summary}
          </p>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
            <span className="text-red-600 font-bold text-base">
              {post.price}
            </span>
            <span className="text-xs text-gray-400">{post.date}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
