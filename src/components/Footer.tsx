import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-ink text-ivory mt-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 py-16 grid gap-12 sm:grid-cols-3">
        <div>
          <p className="font-serif text-3xl">
            SILA<span className="text-goldlight italic"> Collective</span>
          </p>
          <p className="mt-4 text-sm text-ivory/70 leading-relaxed max-w-xs">
            Effortless style for women and little ones. Quality you can feel,
            comfort you can live in — delivered across India.
          </p>
        </div>
        <div className="text-sm">
          <p className="uppercase tracking-[0.2em] text-ivory/50 mb-4 text-xs">Explore</p>
          <ul className="space-y-3">
            <li><Link href="/shop" className="link-sweep">Shop All</Link></li>
            <li><Link href="/shop?c=women" className="link-sweep">Women</Link></li>
            <li><Link href="/shop?c=kids" className="link-sweep">Kids</Link></li>
            <li><Link href="/shop?c=combo" className="link-sweep">Mom &amp; Girl Combos</Link></li>
            <li><Link href="/about" className="link-sweep">Our Story</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="uppercase tracking-[0.2em] text-ivory/50 mb-4 text-xs">Help</p>
          <ul className="space-y-3">
            <li><Link href="/contact" className="link-sweep">Contact Us</Link></li>
            <li><Link href="/policy" className="link-sweep">Shipping &amp; Returns</Link></li>
            <li>
              <a
                href="https://instagram.com/silacollective_"
                target="_blank"
                rel="noopener noreferrer"
                className="link-sweep"
              >
                Instagram — @silacollective_
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/diva_by_divyaa"
                target="_blank"
                rel="noopener noreferrer"
                className="link-sweep"
              >
                Instagram — @diva_by_divyaa
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10 py-6 text-center text-xs tracking-[0.2em] uppercase text-ivory/40">
        © {new Date().getFullYear()} SILA Collective · Made with care in India
      </div>
    </footer>
  );
}
