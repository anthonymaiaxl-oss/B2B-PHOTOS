"use client";

import { motion } from "framer-motion";
import { revealVariants, viewportOnce } from "@/lib/motion";

/** Wrapper de reveal: opacity 0 → 1, scale 1.04 → 1, blur → nítido. */
export default function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li";
}) {
  const Motion = motion[Tag];
  return (
    <Motion
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delay }}
      className={className}
    >
      {children}
    </Motion>
  );
}
