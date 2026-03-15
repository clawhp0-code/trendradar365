import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "TrendRadar 365 | 매일 발견하는 트렌드",
  description: "매일 새로운 트렌드 아이템을 발굴하는 큐레이션 매거진",
  openGraph: {
    title: "TrendRadar 365",
    description: "매일 새로운 트렌드 아이템을 발굴하는 큐레이션 매거진",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
