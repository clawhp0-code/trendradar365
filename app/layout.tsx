import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "TrendRadar365 — 오늘의 트렌드 제품 큐레이션",
    template: "%s | TrendRadar365",
  },
  description:
    "매일 업데이트되는 트렌드 제품 큐레이션. 테크, 라이프스타일 분야의 최신 인기 상품을 발견하세요.",
  openGraph: {
    siteName: "TrendRadar365",
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">📡</span>
              <span className="font-bold text-xl text-gray-900 group-hover:text-red-600 transition-colors">
                TrendRadar<span className="text-red-600">365</span>
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link
                href="/category/테크"
                className="text-gray-600 hover:text-red-600 transition-colors"
              >
                💻 테크
              </Link>
              <Link
                href="/category/라이프스타일"
                className="text-gray-600 hover:text-red-600 transition-colors"
              >
                🌿 라이프스타일
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 min-h-[calc(100vh-140px)]">
          {children}
        </main>

        <footer className="border-t border-gray-200 bg-white mt-16">
          <div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
            <p>
              © {new Date().getFullYear()} TrendRadar365 · 매일 새로운 트렌드
              제품을 발견하세요 📡
            </p>
            <p className="mt-1 text-xs text-gray-400">
              본 사이트의 일부 링크는 제휴 링크로, 구매 시 소정의 수수료를 받을
              수 있습니다.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
