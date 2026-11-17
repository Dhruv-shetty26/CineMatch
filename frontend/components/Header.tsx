"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Flame, Bookmark, Compass } from "lucide-react";
import { useState, useEffect } from "react";
import { getWatchlist } from "@/lib/watchlist";

export default function Header() {
  const pathname = usePathname();
  const [watchlistCount, setWatchlistCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setWatchlistCount(getWatchlist().length);
    };
    updateCount();
    window.addEventListener("watchlist_updated", updateCount);
    return () => window.removeEventListener("watchlist_updated", updateCount);
  }, []);

  const navLinks = [
    { href: "/", label: "Discover", icon: Compass },
    { href: "/popular", label: "Popular", icon: Flame },
    { href: "/watchlist", label: "Watchlist", icon: Bookmark, badge: watchlistCount },
  ];

  return (
    <header className="sticky top-0 z-50 bg-charcoal-900/90 backdrop-blur-md border-b border-charcoal-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-crimson-600 flex items-center justify-center shadow-lg shadow-amber-500/10 group-hover:shadow-amber-500/25 transition-all">
            <Film className="w-5 h-5 text-charcoal-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
              Cine<span className="text-amber-500">Match</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold -mt-1">
              AI Recommendations
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  isActive
                    ? "bg-charcoal-800 text-white shadow-sm border border-charcoal-700"
                    : "text-slate-400 hover:text-white hover:bg-charcoal-850"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-amber-500" : "text-slate-400"
                  }`}
                />
                <span>{link.label}</span>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-crimson-600 text-white shadow-sm">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
