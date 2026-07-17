import { notFound } from "next/navigation";
import Link from "next/link";
import { allProducts, productByHandle, productCategory, byCategory } from "@/lib/catalog";
import ProductView from "@/components/ProductView";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";

export function generateStaticParams() {
  return allProducts().map((p) => ({ handle: p.handle }));
}

export function generateMetadata({ params }: { params: { handle: string } }) {
  const p = productByHandle(params.handle);
  return { title: p ? `${p.title} — SILA Collective` : "SILA Collective" };
}

export default function ProductPage({ params }: { params: { handle: string } }) {
  const product = productByHandle(params.handle);
  if (!product) notFound();

  const related = byCategory(productCategory(product))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-6 pb-20">
      <nav className="text-xs uppercase tracking-[0.18em] text-smoke mb-6 flex gap-2">
        <Link href="/" className="link-sweep">Home</Link>
        <span>/</span>
        <Link href="/shop" className="link-sweep">Shop</Link>
        <span>/</span>
        <span className="text-ink truncate max-w-[200px]">{product.title}</span>
      </nav>

      <ProductView product={product} />

      {related.length > 0 && (
        <section className="mt-24">
          <Reveal>
            <h2 className="font-serif text-3xl sm:text-5xl mb-10">
              You may also <span className="italic text-gold">love</span>
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
