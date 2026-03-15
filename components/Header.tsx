"use client";

import Link from "next/link";
import { useState } from "react";

const CATEGORIES = ["전체", "테크", "라이프스타일", "뷰티", "푸드", "여행"];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      {/* Top bar */}
      <div className="bg-black text-white text-xs text-center py-2 font-medium tracking-widest uppercase">
        매일 발견하는 트렌드 &mdash; TrendRadar 365
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter text-black">
              TREND<span className="text-red-600">RADAR</span>
            </span>
            <span className="text-xs font-bold text-gray-400 hidden sm:block">365</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={cat === "전체" ? "/" : `/category/${encodeURIComponent(cat)}`}
                className="text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors"
              >
                {cat}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-600"
          >
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current mb-1" />
            <div className="w-5 h-0.5 bg-current" />
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 flex flex-wrap gap-3 pb-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={cat === "전체" ? "/" : `/category/${encodeURIComponent(cat)}`}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold text-gray-600 hover:text-red-600 transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
