import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

export const revalidate = 60;

export async function generateStaticParams() {
  const { data } = await supabase.from("posts").select("slug");
  return (data ?? []).map((p) => ({ slug: p.slug }));
}

function renderContent(content: string) {
  const lines = content.split("\n");
  const result: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("## ")) {
      result.push(<h2 key={i}>{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      result.push(<h3 key={i}>{line.slice(4)}</h3>);
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      result.push(<ul key={i}>{items.map((it, j) => <li key={j}>{it}</li>)}</ul>);
      continue;
    } else if (line.startsWith("> ")) {
      result.push(<blockquote key={i}>{line.slice(2)}</blockquote>);
    } else if (line.trim() === "") {
      // skip empty lines
    } else {
      // Handle **bold** inline
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = parts.map((part, j) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={j}>{part.slice(2, -2)}</strong>
          : part
      );
      result.push(<p key={i}>{rendered}</p>);
    }
    i++;
  }
  return result;
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-red-600 transition-colors">홈</Link>
        <span>/</span>
        <Link href={`/category/${encodeURIComponent(post.category)}`} className="hover:text-red-600 transition-colors">
          {post.category}
        </Link>
      </div>

      {/* Category badge */}
      <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
        {post.category}
      </span>

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-black leading-tight text-gray-900 mb-4">
        {post.title}
      </h1>

      {/* Summary */}
      <p className="text-lg text-gray-500 leading-relaxed mb-6">{post.summary}</p>

      {/* Meta */}
      <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-100">
        <span>{formatDate(post.published_at)}</span>
        {post.price && <span className="font-bold text-red-600 text-base">{post.price}</span>}
      </div>

      {/* Thumbnail */}
      {post.thumbnail && (
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-10">
          <Image src={post.thumbnail} alt={post.title} fill className="object-cover" />
        </div>
      )}

      {/* Product info card */}
      {(post.product_code || post.release_date || post.buy_link) && (
        <div className="bg-gray-50 rounded-2xl p-6 mb-10 border border-gray-100">
          <h2 className="font-black text-gray-900 mb-4 text-sm uppercase tracking-widest">제품 정보</h2>
          <div className="space-y-2 text-sm">
            {post.price && (
              <div className="flex justify-between">
                <span className="text-gray-500">가격</span>
                <span className="font-bold text-gray-900">{post.price}</span>
              </div>
            )}
            {post.product_code && (
              <div className="flex justify-between">
                <span className="text-gray-500">제품 코드</span>
                <span className="font-mono text-gray-900">{post.product_code}</span>
              </div>
            )}
            {post.release_date && (
              <div className="flex justify-between">
                <span className="text-gray-500">출시일</span>
                <span className="text-gray-900">{post.release_date}</span>
              </div>
            )}
          </div>
          {post.buy_link && (
            <a
              href={post.buy_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block w-full bg-black text-white text-center text-sm font-bold py-3 rounded-xl hover:bg-red-600 transition-colors"
            >
              구매하기 →
            </a>
          )}
        </div>
      )}

      {/* Content */}
      <div className="prose">{renderContent(post.content)}</div>

      {/* Back link */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600 transition-colors">
          ← 전체 보기
        </Link>
      </div>
    </article>
  );
}
