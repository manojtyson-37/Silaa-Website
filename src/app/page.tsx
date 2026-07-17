import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import { allProducts, byCategory, newLaunches, inr, price } from "@/lib/catalog";

export default function Home() {
  const launches = newLaunches().slice(0, 8);
  const women = byCategory("women");
  const kids = byCategory("kids");
  const combos = byCategory("combo");
  const heroA = launches[3]?.images[0]?.src ?? women[0]?.images[0]?.src;
  const heroB = launches[2]?.images[0]?.src ?? kids[0]?.images[0]?.src;
  const heroC = launches[1]?.images[0]?.src;
  const comboFeature = combos[0];
  const bestOfWomen = women.slice(0, 8);

  return (
    <div className="overflow-x-clip">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-8 pt-10 sm:pt-16 pb-20">
        <h1 className="font-serif leading-[0.95] select-none">
          <span className="block text-[13vw] sm:text-[9vw] animate-riseUp">
            Effortless
          </span>
          <span
            className="block text-[13vw] sm:text-[9vw] italic text-outline animate-riseUp text-right sm:pr-[8vw]"
            style={{ animationDelay: "150ms" }}
          >
            by design
          </span>
        </h1>

        <div className="mt-8 sm:-mt-[6vw] grid grid-cols-12 gap-4 items-end pointer-events-none">
          <div className="col-span-7 sm:col-span-4 sm:col-start-2 relative aspect-[3/4] overflow-hidden animate-fadeIn pointer-events-auto">
            {heroA && (
              <Image
                src={heroA}
                alt="SILA Collective new launch"
                fill
                priority
                sizes="(max-width: 640px) 60vw, 33vw"
                className="object-cover animate-slowZoom"
              />
            )}
          </div>
          <div
            className="col-span-5 sm:col-span-3 relative aspect-[3/4] overflow-hidden animate-fadeIn pointer-events-auto"
            style={{ animationDelay: "250ms" }}
          >
            {heroB && (
              <Image
                src={heroB}
                alt="SILA Collective kids wear"
                fill
                priority
                sizes="(max-width: 640px) 40vw, 25vw"
                className="object-cover animate-slowZoom"
              />
            )}
          </div>
          <div
            className="hidden sm:block col-span-3 relative aspect-[3/4] overflow-hidden animate-fadeIn pointer-events-auto"
            style={{ animationDelay: "400ms" }}
          >
            {heroC && (
              <Image
                src={heroC}
                alt="SILA Collective womenswear"
                fill
                sizes="25vw"
                className="object-cover animate-slowZoom"
              />
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <p className="max-w-md text-smoke leading-relaxed animate-fadeIn" style={{ animationDelay: "500ms" }}>
            Dresses, co-ord sets and twinning combos for you and your little
            one — cut from fabrics you&apos;ll never want to take off.
          </p>
          <Link
            href="/shop"
            className="group inline-flex items-center gap-3 bg-ink text-ivory px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-gold transition-colors duration-300"
          >
            Shop the collection
            <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
          </Link>
        </div>
      </section>

      {/* ── NEW LAUNCH RAIL ──────────────────────────────── */}
      <section className="py-16 bg-cream/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex items-end justify-between mb-8">
          <Reveal>
            <h2 className="font-serif text-4xl sm:text-6xl">
              New <span className="italic text-gold">launches</span>
            </h2>
          </Reveal>
          <Link href="/shop" className="link-sweep text-xs uppercase tracking-[0.2em] whitespace-nowrap mb-2">
            View all
          </Link>
        </div>
        <div className="rail overflow-x-auto">
          <div className="flex gap-5 px-4 sm:px-8 w-max">
            {launches.map((p, i) => (
              <div key={p.id} className="w-[70vw] sm:w-[320px] shrink-0">
                <ProductCard product={p} priority={i < 3} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY EDITORIAL TILES ─────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 py-20 grid sm:grid-cols-3 gap-5">
        {[
          { label: "Women", sub: `${women.length} styles`, href: "/shop?c=women", img: women[1]?.images[0]?.src },
          { label: "Kids", sub: `${kids.length} styles`, href: "/shop?c=kids", img: kids[0]?.images[0]?.src },
          { label: "Mom & Girl", sub: "Twin in style", href: "/shop?c=combo", img: combos[0]?.images[0]?.src },
        ].map((c, i) => (
          <Reveal key={c.label} delay={i * 120}>
            <Link href={c.href} className="group block relative aspect-[3/4] overflow-hidden bg-cream">
              {c.img && (
                <Image
                  src={c.img}
                  alt={c.label}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover card-img"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-6">
                <p className="font-serif text-4xl text-ivory">{c.label}</p>
                <p className="text-ivory/70 text-xs uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                  {c.sub}
                  <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>

      {/* ── MOM & GIRL FEATURE ───────────────────────────── */}
      {comboFeature && (
        <section className="bg-ink text-ivory py-24 relative overflow-hidden">
          <p className="absolute -top-6 left-0 font-serif italic text-[18vw] leading-none text-outline-ivory opacity-20 whitespace-nowrap select-none">
            twinning twinning twinning
          </p>
          <div className="mx-auto max-w-7xl px-4 sm:px-8 grid sm:grid-cols-2 gap-12 items-center relative">
            <Reveal>
              <div className="relative aspect-[3/4] overflow-hidden">
                {comboFeature.images[0] && (
                  <Image
                    src={comboFeature.images[0].src}
                    alt={comboFeature.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                )}
              </div>
            </Reveal>
            <Reveal delay={150}>
              <p className="text-goldlight uppercase tracking-[0.3em] text-xs mb-4">
                The signature edit
              </p>
              <h2 className="font-serif text-5xl sm:text-7xl leading-[1.02]">
                Mom &amp; girl,<br />
                <span className="italic text-goldlight">made to match</span>
              </h2>
              <p className="mt-6 text-ivory/70 leading-relaxed max-w-md">
                Coordinated sets designed for the two of you — same print, same
                softness, double the memories. {comboFeature.title}, from{" "}
                {inr(price(comboFeature))}.
              </p>
              <Link
                href={`/product/${comboFeature.handle}`}
                className="mt-10 inline-flex items-center gap-3 border border-ivory/40 px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-ivory hover:text-ink transition-colors duration-300"
              >
                Shop the combo →
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── BESTSELLERS GRID ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 py-20">
        <Reveal>
          <h2 className="font-serif text-4xl sm:text-6xl mb-10">
            Loved by <span className="italic text-gold">everyone</span>
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
          {bestOfWomen.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 90}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
        <div className="text-center mt-14">
          <Link
            href="/shop"
            className="inline-block border border-ink px-12 py-4 text-xs uppercase tracking-[0.25em] hover:bg-ink hover:text-ivory transition-colors duration-300"
          >
            View all {allProducts().length} styles
          </Link>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────── */}
      <section className="border-y border-ink/10 bg-cream/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-14 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            ["Quality you can feel", "Fabrics chosen by hand"],
            ["All-day comfort", "Breathable, easy fits"],
            ["COD available", "Pay when it arrives"],
            ["Effortless style", "New drops every week"],
          ].map(([t, s], i) => (
            <Reveal key={t} delay={i * 100}>
              <p className="font-serif text-xl">{t}</p>
              <p className="text-xs text-smoke mt-2 uppercase tracking-[0.15em]">{s}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
