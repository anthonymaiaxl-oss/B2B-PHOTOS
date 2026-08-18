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
      className={`fixed inset-x-0 top-0 z-[90] flex items-center justify-between bg-gradient-to-b from-ink/95 to-transparent px-[22px] py-4 transition-opacity duration-500 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <Link
        href="/"
        data-cursor="•"
        className="text-[11px] font-semibold tracking-[0.3em] text-white hover:text-white"
      >
        {eventConfig.name.toUpperCase()}
      </Link>
      <span className="font-[family-name:var(--font-plex)] text-[10px] tracking-[0.16em] text-muted">
        {eventConfig.edition}
      </span>
    </header>
  );
}
