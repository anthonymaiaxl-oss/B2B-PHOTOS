"use client";

import { useEffect, useRef, useState } from "react";

/** Cursor customizado discreto — apenas em desktop com ponteiro fino. */
export default function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [active, setActive] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    setEnabled(fine.matches);
    const onChange = () => setEnabled(fine.matches);
    fine.addEventListener("change", onChange);
    return () => fine.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;
    const onMove = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const hit = target?.closest?.("[data-cursor]") as HTMLElement | null;
      setActive(Boolean(hit));
      setLabel(hit?.dataset.cursor ?? "");

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (dot.current) {
          dot.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
        }
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={dot}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[110] will-change-transform"
    >
      <div
        className={`flex items-center justify-center rounded-full border border-violet-bright/70 font-[family-name:var(--font-plex)] text-[9px] tracking-[0.14em] text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          active
            ? "-ml-7 -mt-7 h-14 w-14 bg-violet/20 opacity-100"
            : "-ml-1.5 -mt-1.5 h-3 w-3 bg-transparent opacity-50"
        }`}
      >
        {active ? label : ""}
      </div>
    </div>
  );
}
