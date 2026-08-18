"use client";

import { motion } from "framer-motion";
import { revealVariants, viewportOnce } from "@/lib/motion";

/** Wrapper de reveal: opacity 0 → 1, scale 1.04 → 1, blur → nítido. */
export default function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={revealVariants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
