import type { Transition, Variants } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1] as const;

export const smooth: Transition = { duration: 0.8, ease: EASE };

/** opacity 0 / scale 1.05 / blur → nítido (600–900ms). */
export const revealVariants: Variants = {
  hidden: { opacity: 0, scale: 1.04, filter: "blur(6px)", y: 22 },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.85, ease: EASE },
  },
};

export const riseVariants: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const viewportOnce = { once: true, amount: 0.15 } as const;
