"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { eventConfig } from "@/config/event";
import { EASE } from "@/lib/motion";

export default function Preloader() {
  const [done, setDone] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const finish = () => setDone(true);
    const wait = reduced ? 0 : 600;

    if (document.readyState === "complete") {
      const t = window.setTimeout(finish, wait);
      return () => window.clearTimeout(t);
    }

    const onLoad = () => window.setTimeout(finish, wait);
    window.addEventListener("load", onLoad, { once: true });
    const safety = window.setTimeout(finish, 2200);
    return () => {
      window.removeEventListener("load", onLoad);
      window.clearTimeout(safety);
    };
  }, [reduced]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          aria-hidden="true"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-6 bg-ink"
        >
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="text-[13px] font-medium tracking-[0.42em]"
          >
            {eventConfig.name.toUpperCase()}
          </motion.span>
          <span className="h-px w-[140px] overflow-hidden bg-[#1c1a25]">
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, ease: EASE }}
              className="block h-px origin-left bg-gradient-to-r from-violet to-violet-bright"
            />
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
