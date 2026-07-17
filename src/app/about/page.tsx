import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { byCategory } from "@/lib/catalog";

export const metadata = { title: "Our Story — SILA Collective" };

export default function AboutPage() {
  const img1 = byCategory("women")[2]?.images[0]?.src;
  const img2 = byCategory("kids")[1]?.images[0]?.src;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-12 pb-20">
      <Reveal>
        <h1 className="font-serif text-6xl sm:text-8xl leading-[0.95]">
          Made with <span className="italic text-gold">love,</span>
          <br />
          worn with <span className="italic text-outline">ease</span>
        </h1>
      </Reveal>

      <div className="grid sm:grid-cols-2 gap-12 mt-16 items-start">
        <Reveal>
          <div className="relative aspect-[3/4] overflow-hidden bg-cream">
            {img1 && (
              <Image src={img1} alt="SILA Collective womenswear" fill sizes="(max-width:640px) 100vw, 50vw" className="object-cover" />
            )}
          </div>
        </Reveal>
        <div className="space-y-6 text-smoke leading-relaxed sm:pt-10">
          <Reveal>
            <p>
              SILA Collective began with a simple belief — that everyday
              clothing should feel as good as it looks. No stiff fabrics, no
              fussy fits. Just pieces you reach for again and again.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <p>
              Every dress, co-ord and frock is chosen for the way it moves,
              breathes and lasts. From flowy rayon maxis to hand-pleated
              chiffon and pure organza blazers, quality is something you can
              feel the moment it arrives.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <p>
              And because style runs in the family, our mom &amp; girl twinning
              combos let you share more than a wardrobe — matching prints,
              matching moments.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="relative aspect-[4/3] overflow-hidden bg-cream mt-8">
              {img2 && (
                <Image src={img2} alt="SILA Collective kidswear" fill sizes="(max-width:640px) 100vw, 40vw" className="object-cover" />
              )}
            </div>
          </Reveal>
          <Reveal delay={400}>
            <Link
              href="/shop"
              className="inline-block bg-ink text-ivory px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-gold transition-colors"
            >
              Explore the collection
            </Link>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
