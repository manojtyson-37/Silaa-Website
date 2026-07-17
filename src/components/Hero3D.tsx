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

    const onPrefChange = () => onLeave();
    scene.addEventListener("pointermove", onMove);
    scene.addEventListener("pointerleave", onLeave);
    rmq.addEventListener("change", onPrefChange);
    return () => {
      cancelAnimationFrame(frame.current);
      scene.removeEventListener("pointermove", onMove);
      scene.removeEventListener("pointerleave", onLeave);
      rmq.removeEventListener("change", onPrefChange);
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
        {/* deep background layer — outlined echo type */}
        <p
          aria-hidden
          className="hero-layer hero-layer-back pointer-events-none select-none absolute top-6 left-0 right-0 z-0 text-center font-serif italic hidden sm:block sm:text-[min(11vw,140px)] leading-none text-outline opacity-[0.13] whitespace-nowrap"
        >
          SILA Collective
        </p>

        <h1 className="relative z-10 font-serif leading-[0.95] select-none [transform:translateZ(60px)] text-[clamp(2.6rem,13vw,4.2rem)] sm:text-[clamp(4rem,9vw,9rem)]">
          <span className="block animate-riseUp">Effortless</span>
          <span
            className="block italic text-outline animate-riseUp text-right sm:pr-[8vw]"
            style={{ animationDelay: "150ms" }}
          >
            by design
          </span>
        </h1>

        <div className="mt-8 sm:-mt-[6vw] grid grid-cols-12 gap-4 items-end [transform-style:preserve-3d]">
          {cards.slice(0, 3).map((card, i) => (
            <div
              key={card.href + i}
              className={`hero-layer ${positions[i]} ${depths[i]} relative z-20 animate-fadeIn`}
              style={{ animationDelay: `${i * 180}ms`, ["--depth" as string]: i === 2 ? 1.6 : i === 0 ? 1 : 0.55 }}
            >
              <Link
                href={card.href}
                className="group block relative aspect-[3/4] overflow-hidden bg-cream shadow-[0_30px_60px_-20px_rgba(20,18,16,0.35)]"
              >
                <Image
                  src={card.src}
                  alt={card.title}
                  fill
                  priority={i < 2}
                  sizes="(max-width: 640px) 60vw, 33vw"
                  className="object-cover animate-slowZoom"
                />
                <span className="hero-card-caption absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 group-focus-within:translate-y-0 transition-transform duration-500 bg-ivory/95 backdrop-blur px-4 py-3 text-xs uppercase tracking-[0.15em] flex justify-between">
                  <span className="truncate mr-2">{card.title}</span>
                  <span className="text-gold shrink-0">{card.price}</span>
                </span>
              </Link>
            </div>
          ))}

          {/* floating accents at extreme depth */}
          <span
            aria-hidden
            className="hero-layer hero-float hidden sm:grid absolute z-30 -top-8 right-[14%] sm:[transform:translateZ(180px)] w-16 h-16 place-items-center rounded-full border border-gold/50 bg-ivory/70 backdrop-blur text-gold text-xl"
            style={{ ["--depth" as string]: 2.2 }}
          >
            ✦
          </span>
          <span
            aria-hidden
            className="hero-layer hero-float hidden sm:block absolute z-30 bottom-[18%] left-[2%] sm:[transform:translateZ(120px)] bg-ink text-ivory text-[11px] uppercase tracking-[0.25em] px-4 py-2.5"
            style={{ ["--depth" as string]: 1.4, animationDelay: "1.2s" }}
          >
            COD available
          </span>
          <span
            aria-hidden
            className="hero-layer hero-float hidden lg:block absolute z-30 top-[30%] right-[9%] sm:[transform:translateZ(200px)] bg-gold text-ivory text-[11px] uppercase tracking-[0.25em] px-4 py-2.5"
            style={{ ["--depth" as string]: 2.6, animationDelay: "0.6s" }}
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
