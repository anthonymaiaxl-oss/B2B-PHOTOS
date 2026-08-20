"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { eventConfig } from "@/config/event";

export default function Header({ solid = false }: { solid?: boolean }) {
  const [visible, setVisible] = useState(solid);

  useEffect(() => {
    if (solid) return;
    const onScroll = () => setVisible(window.scrollY > 220);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [solid]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[90] transition-opacity duration-500 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="flex items-center justify-between bg-gradient-to-b from-ink/95 via-ink/70 to-transparent px-[22px] py-4 backdrop-blur-[2px]">
        <Link
          href="/"
          data-cursor="•"
          className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.3em] text-white"
        >
          <span className="block h-1.5 w-1.5 rotate-45 bg-gold" />
          {eventConfig.brand.toUpperCase()}
        </Link>
        <span className="hidden font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] text-gold/70 sm:block">
          {eventConfig.name.toUpperCase()}
        </span>
        <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.16em] text-muted">
          {eventConfig.edition}
        </span>
      </div>
      <div className="gold-rule opacity-50" />
    </header>
  );
}
