"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { Photo } from "@/lib/site";

const PANELS = 3;
const INTERVAL_MS = 3500;
const ease = [0.22, 1, 0.36, 1] as const;

export function HeroSlideshow({ photos }: { photos: Photo[] }) {
  const reduce = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setTick((t) => t + 1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduce]);

  return Array.from({ length: PANELS }, (_, panel) => {
    const list = isDesktop
      ? photos.filter((_, i) => i % PANELS === panel)
      : panel === 0
        ? photos
        : [];
    // No computador os painéis trocam em rodízio; no celular só o primeiro aparece e troca a cada tick.
    const advances = isDesktop
      ? Math.floor((tick + PANELS - 1 - panel) / PANELS)
      : tick;
    const active = list.length ? advances % list.length : 0;
    const loaded = Math.min(list.length, advances + 2);

    return (
      <motion.div
        key={panel}
        className={
          panel === 0
            ? "absolute inset-0 overflow-hidden md:relative"
            : "relative hidden overflow-hidden md:block"
        }
        initial={reduce ? false : { clipPath: "inset(0% 0% 100% 0%)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
        transition={{ duration: 1.4, ease, delay: 0.15 * panel }}
      >
        {list.slice(0, loaded).map((photo, i) => {
          const isActive = i === active;
          return (
            <Image
              key={photo.src}
              src={photo.src}
              alt={isActive ? photo.alt : ""}
              fill
              priority={i === 0 && panel === 0}
              sizes="(min-width: 768px) 34vw, 100vw"
              className="object-cover brightness-[0.55] saturate-[0.85]"
              style={{
                opacity: isActive ? 1 : 0,
                transform: isActive ? "scale(1)" : "scale(1.08)",
                transition: "opacity 1.6s ease, transform 7s ease-out",
              }}
            />
          );
        })}
      </motion.div>
    );
  });
}
