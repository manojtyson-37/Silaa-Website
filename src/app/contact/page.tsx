import Reveal from "@/components/Reveal";

export const metadata = { title: "Contact — SILA Collective" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 pt-12 pb-20">
      <Reveal>
        <h1 className="font-serif text-6xl sm:text-7xl">
          Say <span className="italic text-gold">hello</span>
        </h1>
        <p className="mt-6 text-smoke leading-relaxed max-w-xl">
          Questions about sizing, your order, or a custom mom &amp; girl combo?
          We&apos;d love to hear from you.
        </p>
      </Reveal>
      <div className="grid sm:grid-cols-2 gap-6 mt-12">
        <Reveal delay={100}>
          <a
            href="https://instagram.com/silacollective_"
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-ink/15 p-8 hover:border-gold transition-colors group"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-smoke">Instagram</p>
            <p className="font-serif text-2xl mt-3 group-hover:text-gold transition-colors">
              @silacollective_
            </p>
            <p className="text-sm text-smoke mt-2">DM us — fastest response</p>
          </a>
        </Reveal>
        <Reveal delay={200}>
          <a
            href="mailto:divabydivyaa@gmail.com"
            className="block border border-ink/15 p-8 hover:border-gold transition-colors group"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-smoke">Email</p>
            <p className="font-serif text-2xl mt-3 group-hover:text-gold transition-colors break-all">
              divabydivyaa@gmail.com
            </p>
            <p className="text-sm text-smoke mt-2">Orders &amp; support</p>
          </a>
        </Reveal>
      </div>
    </div>
  );
}
