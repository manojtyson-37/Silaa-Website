import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export const metadata = { title: "Our Story — SILA Collective" };

const FOUNDER_IMG = "/brand/founder.jpg";
const STORY_IMG = "/brand/story.jpg";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-12 pb-20">
      <Reveal>
        <h1 className="font-serif text-5xl sm:text-7xl leading-[1.02]">
          SILA — Everyday Style,
          <br />
          <span className="italic text-gold">Effortlessly.</span>
        </h1>
      </Reveal>

      <div className="grid sm:grid-cols-2 gap-12 mt-16 items-start">
        <Reveal>
          <figure>
            <div className="relative aspect-[4/5] overflow-hidden bg-cream">
              <Image
                src={FOUNDER_IMG}
                alt="The founder of SILA Collective in a blue printed saree, standing beside a vintage car"
                fill
                priority
                sizes="(max-width:640px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-xs uppercase tracking-[0.2em] text-smoke">
              The founder of SILA Collective
            </figcaption>
          </figure>
        </Reveal>
        <div className="space-y-6 text-smoke leading-relaxed sm:pt-6">
          <Reveal>
            <p>
              At SILA, we believe workdays-to-weekends style should feel
              effortless.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <p>
              Born from the idea that women deserve clothing that moves
              seamlessly through every part of their day, SILA creates modern,
              minimal and versatile pieces designed for real life.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <p>
              Whether you&apos;re heading to work, meeting friends, traveling
              or enjoying a special occasion, our collections are thoughtfully
              crafted to help you look graceful, confident and comfortable —
              without compromising on style.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <p>
              Our designs focus on clean silhouettes, timeless aesthetics and
              everyday wearability — fashion that feels as good as it looks.
              And because style runs in the family, our mom &amp; girl twinning
              combos let you share more than a wardrobe.
            </p>
          </Reveal>
          <Reveal delay={400}>
            <div className="relative aspect-[4/3] overflow-hidden bg-cream mt-8">
              <Image
                src={STORY_IMG}
                alt="A model wearing a SILA Collective dress outdoors"
                fill
                sizes="(max-width:640px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={500}>
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
