import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="text-2xl font-black tracking-tighter mb-2">
              TREND<span className="text-red-500">RADAR</span>
              <span className="text-gray-500 text-sm font-bold ml-1">365</span>
            </div>
            <p className="text-gray-400 text-sm max-w-xs">
              매일 새로운 트렌드 아이템을 발굴하는 큐레이션 매거진
            </p>
          </div>
          <div className="flex gap-8 text-sm text-gray-400">
            <Link href="/" className="hover:text-white transition-colors">홈</Link>
            <Link href="/category/테크" className="hover:text-white transition-colors">테크</Link>
            <Link href="/category/라이프스타일" className="hover:text-white transition-colors">라이프스타일</Link>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-xs text-gray-600">
          © {new Date().getFullYear()} TrendRadar 365. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
