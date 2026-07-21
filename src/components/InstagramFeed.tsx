import Image from "next/image";
import Reveal from "@/components/Reveal";

const PROFILE_URL = "https://instagram.com/silacollective_";

type Tile = { src: string; href: string; collab?: string };

// Real posts pulled directly from @silacollective_'s Instagram (logged in via
// browser, image + permalink captured per post) — not catalog photography.
// Collab/repost tiles (other creators' own photos) are held back until each
// collaborator's permission to rehost is confirmed — see feedback memory
// "collab-image-consent" — don't add collab entries here without that.
const tiles: Tile[] = [
  { src: "/instagram/post-01.jpg", href: "https://www.instagram.com/silacollective_/p/Da-eS6zmuSR/" },
  { src: "/instagram/post-02.jpg", href: "https://www.instagram.com/silacollective_/p/Das-Oi0yxh7/" },
  { src: "/instagram/post-03.jpg", href: "https://www.instagram.com/silacollective_/p/DaVOCDhmmpL/" },
  { src: "/instagram/post-04.jpg", href: "https://www.instagram.com/silacollective_/p/DaNfFM5mp-G/" },
  { src: "/instagram/post-05.jpg", href: "https://www.instagram.com/silacollective_/p/DaA85Nzmido/" },
];

export default function InstagramFeed() {
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
            <Reveal key={t.href} delay={(i % 6) * 80}>
              <a
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block w-[62vw] sm:w-[240px] aspect-square shrink-0 overflow-hidden bg-ink"
              >
                <Image
                  src={t.src}
                  alt={t.collab ? `Collab post with ${t.collab}` : "SILA Collective Instagram post"}
                  fill
                  sizes="(max-width: 640px) 62vw, 240px"
                  className="object-cover card-img"
                />
                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/50 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-ivory text-xs uppercase tracking-[0.2em]">
                  <span>♡ View post</span>
                </div>
                {t.collab && (
                  <span className="absolute top-3 left-3 bg-ivory/90 text-ink text-[10px] uppercase tracking-[0.15em] px-2.5 py-1">
                    Collab · {t.collab}
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
