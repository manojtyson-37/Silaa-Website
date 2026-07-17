"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

const nav = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?c=women", label: "Women" },
  { href: "/shop?c=kids", label: "Kids" },
  { href: "/shop?c=combo", label: "Mom & Girl" },
  { href: "/about", label: "Our Story" },
];

export default function Header() {
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="bg-ink text-ivory text-[11px] tracking-[0.25em] uppercase overflow-hidden whitespace-nowrap">
        <div className="animate-marquee inline-block py-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i}>
              {[
                "Free shipping on prepaid orders",
                "Cash on delivery available",
                "New launches every week",
                "Mom & girl twinning combos",
              ].map((t) => (
                <span key={t} className="mx-8">
                  {t} <span className="text-goldlight mx-2">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-ivory/85 backdrop-blur-xl shadow-[0_1px_0_0_rgba(20,18,16,0.08)]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex items-center justify-between h-16 sm:h-20">
          <button
            className="sm:hidden p-2 -ml-2 cursor-pointer"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>

          <Link href="/" className="font-serif text-2xl sm:text-3xl tracking-tight">
            SILA<span className="text-gold italic"> Collective</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-8 text-[13px] tracking-[0.14em] uppercase">
            {nav.map((n) => (
              <Link key={n.label} href={n.href} className="link-sweep">
                {n.label}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setOpen(true)}
            className="relative p-2 -mr-2 cursor-pointer"
            aria-label="Open cart"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 7h12l1 14H5L6 7z" />
              <path d="M9 7a3 3 0 016 0" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gold text-ivory text-[10px] w-5 h-5 rounded-full grid place-items-center font-medium">
                {count}
              </span>
            )}
          </button>
        </div>

        {menuOpen && (
          <nav className="sm:hidden bg-ivory border-t border-ink/10 px-6 py-4 flex flex-col gap-4 text-sm tracking-[0.14em] uppercase animate-fadeIn">
            {nav.map((n) => (
              <Link key={n.label} href={n.href} onClick={() => setMenuOpen(false)}>
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
