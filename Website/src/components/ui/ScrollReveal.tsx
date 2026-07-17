"use client";

import React, { useRef, ReactNode } from "react";
import { motion, useInView, Variants } from "framer-motion";

/* -- Variants -- */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1 },
};

const VARIANTS = { fadeUp, fadeIn, fadeLeft, fadeRight, scaleIn };

/* -- Types -- */

type Variant = keyof typeof VARIANTS;

interface RevealProps {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

/* -- ScrollReveal -- */

export function ScrollReveal({
  children,
  variant = "fadeUp",
  delay = 0,
  duration = 0.6,
  className,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "0px 0px -80px 0px" });

  return (
    <motion.div
      ref={ref}
      variants={VARIANTS[variant]}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -- StaggerReveal -- */

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0,
    },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
};

interface StaggerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}

export function StaggerReveal({ children, className, delay = 0, once = true }: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "0px 0px -60px 0px" });

  return (
    <motion.div
      ref={ref}
      variants={{ ...staggerContainer, visible: { ...staggerContainer.visible, transition: { staggerChildren: 0.12, delayChildren: delay } } }}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { staggerItem };
