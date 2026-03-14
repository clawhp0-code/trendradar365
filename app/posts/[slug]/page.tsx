import { getPostBySlug, getAllSlugs } from "@/lib/posts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.date,
      images: post.thumbnail ? [{ url: post.thumbnail }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: post.thumbnail ? [post.thumbnail] : [],
    },
  };
}

const categoryEmoji: Record<string, string> = {
  테크: "💻",
  라이프스타일: "🌿",
};

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const emoji = categoryEmoji[post.category] ?? "📦";

  return (
    <article className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-red-600 transition-colors">
          홈
        </Link>
        <span>/</span>
        <Link
          href={`/category/${post.category}`}
          className="hover:text-red-600 transition-colors"
        >
          {emoji} {post.category}
        </Link>
        <span>/</span>
        <span className="text-gray-600 truncate max-w-[200px]">{post.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-1 rounded-full border border-red-100">
            {emoji} {post.category}
          </span>
          <span className="text-sm text-gray-400">{post.date}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-3">
          {post.title}
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed">{post.summary}</p>
      </header>

      {/* Thumbnail */}
      {post.thumbnail && (
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-8 bg-gray-100">
          <Image
            src={post.thumbnail}
            alt={post.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* Price & Buy CTA */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">현재 가격</p>
          <p className="text-3xl font-extrabold text-red-600">{post.price}</p>
        </div>
        {post.buyLink && (
          <a
            href={post.buyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow-sm hover:shadow-md text-base whitespace-nowrap"
          >
            🛒 지금 구매하기
          </a>
        )}
      </div>

      {/* Content */}
      {post.contentHtml && (
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      )}

      {/* Back */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors font-medium"
        >
          ← 전체 트렌드 보기
        </Link>
      </div>
    </article>
  );
}
