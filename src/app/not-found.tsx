import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center px-6 text-center">
      <div>
        <p className="font-serif italic text-8xl text-outline">404</p>
        <h1 className="font-serif text-3xl mt-4">This page slipped away</h1>
        <Link
          href="/shop"
          className="mt-8 inline-block bg-ink text-ivory px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-gold transition-colors"
        >
          Back to the collection
        </Link>
      </div>
    </div>
  );
}
