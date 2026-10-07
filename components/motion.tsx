"use client";

import {
  MotionConfig,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, useState, type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;
// Dispara logo que o elemento entra na tela, para não sobrar área vazia quando se rola rápido no celular.
const inView = { once: true, margin: "0px 0px -4% 0px" } as const;

type WithChildren = { children: ReactNode; className?: string };

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
}: WithChildren & { delay?: number; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={inView}
      transition={{ duration: 0.7, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

export function LineReveal({
  children,
  className,
  delay = 0,
  immediate = false,
}: WithChildren & { delay?: number; immediate?: boolean }) {
  const shown = { y: "0%" };
  return (
    <span className={`mb-[-0.14em] block overflow-hidden pb-[0.14em] ${className ?? ""}`}>
      <motion.span
        className="block"
        initial={{ y: "110%" }}
        {...(immediate
          ? { animate: shown }
          : { whileInView: shown, viewport: inView })}
        transition={{ duration: 1.1, ease, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export function ClipReveal({
  children,
  className,
  delay = 0,
}: WithChildren & { delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={inView}
      transition={{ duration: 0.9, ease, delay }}
    >
      <motion.div
        className="relative h-full w-full"
        initial={reduce ? false : { scale: 1.15 }}
        whileInView={{ scale: 1 }}
        viewport={inView}
        transition={{ duration: 1.2, ease, delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function DrawLine({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.span
      aria-hidden
      className={`block h-px origin-left ${className ?? ""}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={inView}
      transition={{ duration: 1.2, ease, delay }}
    />
  );
}

export function HeroParallax({ children, className }: WithChildren) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ y }}
      initial={{ scale: 1.12 }}
      animate={{ scale: 1 }}
      transition={{ duration: 2.4, ease }}
    >
      {children}
    </motion.div>
  );
}

export function HeroFade({ children, className }: WithChildren) {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 520], [1, 0]);
  const y = useTransform(scrollY, [0, 520], [0, -60]);
  return (
    <motion.div className={className} style={{ opacity, y }}>
      {children}
    </motion.div>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-70 h-0.5 origin-left bg-accent"
      style={{ scaleX }}
    />
  );
}

export function StickyHeader({ children }: { children: ReactNode }) {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);
  useMotionValueEvent(scrollY, "change", (value) => {
    setVisible(value > window.innerHeight * 0.85);
  });
  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-60 border-b border-white/10 bg-foreground text-white"
      initial={false}
      animate={{ y: visible ? "0%" : "-100%" }}
      transition={{ duration: 0.5, ease }}
      inert={!visible}
    >
      {children}
    </motion.div>
  );
}
