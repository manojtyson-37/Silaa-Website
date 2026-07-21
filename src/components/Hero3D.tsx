"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

export type HeroCard = {
  src: string;
  href: string;
  title: string;
  price: string;
};

/**
 * Pointer-tracked 3D parallax hero. Pure CSS 3D (no WebGL) — the scene
 * tilts toward the cursor and each layer sits at a different translateZ
 * depth. Falls back to a gentle float loop on touch devices and goes
 * fully static under prefers-reduced-motion.
 */
export default function Hero3D({ cards }: { cards: HeroCard[] }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number>(0);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const rmq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onMove = (e: PointerEvent) => {
      if (rmq.matches) return;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const r = scene.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5; // -0.5..0.5
        const y = (e.clientY - r.top) / r.height - 0.5;
        scene.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
        scene.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
        scene.style.setProperty("--px", x.toFixed(3));
        scene.style.setProperty("--py", y.toFixed(3));
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame.current);
      scene.style.setProperty("--rx", "0deg");
      scene.style.setProperty("--ry", "0deg");
      scene.style.setProperty("--px", "0");
      scene.style.setProperty("--py", "0");
    };

    scene.addEventListener("pointermove", onMove);
    scene.addEventListener("pointerleave", onLeave);
    rmq.addEventListener("change", onLeave);
    return () => {
      cancelAnimationFrame(frame.current);
      scene.removeEventListener("pointermove", onMove);
      scene.removeEventListener("pointerleave", onLeave);
      rmq.removeEventListener("change", onLeave);
    };
  }, []);

  const depths = [
    "sm:[transform:translateZ(90px)]",
    "sm:[transform:translateZ(40px)]",
    "sm:[transform:translateZ(140px)]",
  ];
  const positions = [
    "col-span-7 sm:col-span-4 sm:col-start-2",
    "col-span-5 sm:col-span-3",
    "hidden sm:block sm:col-span-3",
  ];

  return (
    <section
      ref={sceneRef}
      className="hero-scene relative mx-auto max-w-7xl px-4 sm:px-8 pt-10 sm:pt-16 pb-20"
    >
      <div className="hero-tilt">
        {/* deep background layer — pure solid, massive, ultra-faint text */}
        <p
          aria-hidden
          className="hero-layer hero-layer-back pointer-events-none select-none absolute top-[-4%] left-0 right-0 z-0 text-center font-serif italic hidden sm:block sm:text-[min(14vw,180px)] leading-none opacity-[0.03] text-ink whitespace-nowrap overflow-hidden"
        >
          SILA Collective
        </p>

        {/* Clean, massive primary heading */}
        <h1 className="relative z-10 font-serif leading-[0.9] select-none [transform:translateZ(80px)] text-[clamp(3.5rem,15vw,6rem)] sm:text-[clamp(5rem,11vw,11rem)] text-center sm:text-left flex flex-col items-center sm:items-start tracking-tight">
          <span className="block animate-riseUp">Effortless</span>
          <span
            className="block italic text-gold animate-riseUp sm:ml-[8vw]"
            style={{ animationDelay: "150ms" }}
          >
            by design
          </span>
        </h1>

        <div className="mt-12 sm:-mt-[4vw] grid grid-cols-12 gap-4 items-end [transform-style:preserve-3d] relative">
          
          {/* Subtle Glow / Lighting Mesh behind cards */}
          <div className="absolute inset-0 bg-gradient-to-tr from-goldlight/20 to-transparent blur-[100px] z-0 -mx-10 rounded-full [transform:translateZ(20px)] opacity-60 pointer-events-none" />

          {cards.slice(0, 3).map((card, i) => (
            <div
              key={card.href}
              className={`hero-layer ${positions[i]} ${depths[i]} relative z-20 animate-fadeIn transition-transform duration-700 ease-out`}
              style={{ animationDelay: `${i * 180}ms`, ["--depth" as string]: i === 2 ? 1.6 : i === 0 ? 1 : 0.55 }}
            >
              <Link
                href={card.href}
                className="group block relative aspect-[3/4] overflow-hidden rounded-md bg-cream shadow-[0_20px_40px_-15px_rgba(20,18,16,0.4)] sm:shadow-[0_40px_80px_-20px_rgba(20,18,16,0.35)]"
              >
                <Image
                  src={card.src}
                  alt={card.title}
                  fill
                  priority={i < 2}
                  sizes="(max-width: 640px) 60vw, 33vw"
                  className="object-cover animate-slowZoom scale-105 group-hover:scale-110 transition-transform duration-[1.5s] ease-[cubic-bezier(0.22,1,0.36,1)]"
                />
                <span className="hero-card-caption absolute inset-x-2 bottom-2 translate-y-[120%] group-hover:translate-y-0 group-focus-within:translate-y-0 transition-transform duration-500 ease-out bg-ivory/80 backdrop-blur-md border border-ivory/50 rounded px-4 py-3 text-[10px] uppercase tracking-[0.2em] flex justify-between shadow-lg">
                  <span className="truncate mr-2 font-medium">{card.title}</span>
                  <span className="text-gold shrink-0 font-medium">{card.price}</span>
                </span>
              </Link>
            </div>
          ))}

          {/* floating accents at extreme depth - Glassmorphism */}
          <span
            aria-hidden
            className="hero-layer hero-float hidden sm:grid absolute z-30 pointer-events-none -top-12 right-[12%] sm:[transform:translateZ(220px)] w-20 h-20 place-items-center rounded-full border border-white/60 bg-white/30 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.1)] text-gold text-2xl"
            style={{ ["--depth" as string]: 2.5 }}
          >
            ✦
          </span>
          <span
            aria-hidden
            className="hero-layer hero-float hidden sm:block absolute z-30 pointer-events-none bottom-[12%] left-[4%] sm:[transform:translateZ(160px)] bg-ink/90 backdrop-blur-md border border-ink/20 text-ivory text-[10px] uppercase tracking-[0.3em] px-5 py-3 rounded-full shadow-2xl"
            style={{ ["--depth" as string]: 1.8, animationDelay: "1.2s" }}
          >
            COD available
          </span>
          <span
            aria-hidden
            className="hero-layer hero-float hidden lg:block absolute z-30 pointer-events-none top-[25%] right-[5%] sm:[transform:translateZ(280px)] bg-white/40 backdrop-blur-lg border border-white/60 text-ink text-[10px] font-medium uppercase tracking-[0.3em] px-5 py-3 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
            style={{ ["--depth" as string]: 3.2, animationDelay: "0.6s" }}
          >
            New drops weekly
          </span>
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <p
          className="max-w-md text-smoke leading-relaxed animate-fadeIn"
          style={{ animationDelay: "500ms" }}
        >
          Dresses, co-ord sets and twinning combos for you and your little one
          — cut from fabrics you&apos;ll never want to take off.
        </p>
        <Link
          href="/shop"
          className="group inline-flex items-center gap-3 bg-ink text-ivory px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-gold transition-colors duration-300"
        >
          Shop the collection
          <span className="transition-transform duration-300 group-hover:translate-x-1.5">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
