import Image from "next/image";
import Reveal from "@/components/Reveal";
import instagramPosts from "@/data/instagram_posts.json";

const PROFILE_URL = "https://instagram.com/silacollective_";

type Post = { id: string; href: string; src: string };

// Real posts pulled directly from @silacollective_'s Instagram (logged in via
// browser, image + permalink captured per post, self-hosted in public/instagram/
// since Instagram's CDN links are signed and expire) — not catalog photography.
// This is a manual snapshot of the latest posts, not a live feed (no Graph API
// token configured) — re-run the same capture process to refresh.
// Collab/repost tiles (other creators' own photos) are held back until each
// collaborator's permission to rehost is confirmed — see feedback memory
// "collab-image-consent" — don't add collab entries here without that.
const posts: Post[] = instagramPosts;

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
            Real outfits, real moments — tag us to be featured next.
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
          {posts.map((p, i) => (
            <Reveal key={p.id} delay={(i % 6) * 80}>
              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block w-[62vw] sm:w-[240px] aspect-square shrink-0 overflow-hidden bg-ink"
              >
                <Image
                  src={p.src}
                  alt={`SILA Collective Instagram post ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 62vw, 240px"
                  className="object-cover card-img"
                />
                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/50 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-ivory text-xs uppercase tracking-[0.2em]">
                  <span>♡ View post</span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
