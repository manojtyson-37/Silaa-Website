import Image from "next/image";
import Reveal from "@/components/Reveal";
import { allProducts, byCategory } from "@/lib/catalog";

type Tile = { src: string; alt: string; handle: string; collab: boolean };

const PROFILE_URL = "https://instagram.com/silacollective_";
const COLLAB_HANDLE = "@diva_by_divyaa";

// No Instagram Graph API credentials are configured, so this rail simulates
// "recent posts" using the store's own product photography instead of a live
// feed. Every tile links out to the real profile.
function pickTiles(): Tile[] {
  const combos = byCategory("combo");
  const women = byCategory("women");
  const kids = byCategory("kids");
  const pool: { list: typeof women; collab: boolean }[] = [
    { list: women, collab: false },
    { list: kids, collab: false },
    { list: combos, collab: true },
    { list: women, collab: false },
    { list: combos, collab: true },
    { list: kids, collab: false },
    { list: women, collab: false },
    { list: combos, collab: true },
    { list: kids, collab: false },
    { list: women, collab: false },
  ];
  const seen = new Set<string>();
  const tiles: Tile[] = [];
  pool.forEach((slot, i) => {
    const candidate =
      slot.list.find((p) => p.images[0]?.src && !seen.has(p.handle)) ??
      allProducts().find((p) => p.images[0]?.src && !seen.has(p.handle));
    if (!candidate || !candidate.images[0]?.src) return;
    seen.add(candidate.handle);
    // Only tag as a collab when the tile actually came from the combos
    // list (a real collab product) — never on a fallback substitute.
    const isCollabCandidate = combos.includes(candidate);
    tiles.push({
      src: candidate.images[0].src,
      alt: candidate.title,
      handle: candidate.handle,
      collab: slot.collab && isCollabCandidate && i % 2 === 0,
    });
  });
  return tiles;
}

export default function InstagramFeed() {
  const tiles = pickTiles();
  if (tiles.length === 0) return null;

  return (
    <section className="py-20 bg-cream/40 border-t border-ink/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 flex items-end justify-between mb-8">
        <Reveal>
          <p className="text-gold uppercase tracking-[0.3em] text-xs mb-3">
            @silacollective_
          </p>
          <h2 className="font-serif text-4xl sm:text-6xl">
            Straight off the <span className="italic text-gold">'gram</span>
          </h2>
          <p className="mt-3 text-smoke text-sm max-w-md">
            Real outfits, real collabs — tag us to be featured next.
          </p>
        </Reveal>
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="link-sweep text-xs uppercase tracking-[0.2em] whitespace-nowrap mb-2"
        >
          Follow along
        </a>
      </div>

      <div className="rail overflow-x-auto">
        <div className="flex gap-4 px-4 sm:px-8 w-max">
          {tiles.map((t, i) => (
            <Reveal key={t.handle} delay={(i % 6) * 80}>
              <a
                href={PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block w-[62vw] sm:w-[240px] aspect-square shrink-0 overflow-hidden bg-ink"
              >
                <Image
                  src={t.src}
                  alt={t.alt}
                  fill
                  sizes="(max-width: 640px) 62vw, 240px"
                  className="object-cover card-img"
                />
                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/50 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-ivory text-xs uppercase tracking-[0.2em]">
                  <span>♡ Shop the look</span>
                </div>
                {t.collab && (
                  <span className="absolute top-3 left-3 bg-ivory/90 text-ink text-[10px] uppercase tracking-[0.15em] px-2.5 py-1">
                    Collab · {COLLAB_HANDLE}
                  </span>
                )}
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
