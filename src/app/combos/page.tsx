import ComboCard from "./ComboCard";

export const metadata = {
  title: "Combo Sets — SILA Collective",
  description: "Curated bundles — shop our combo sets at a special price.",
};

export const revalidate = 60;

type ComboItem = {
  id: number;
  variant_color: string | null;
  variant_size: string | null;
};

type Combo = {
  id: number;
  name: string;
  description: string | null;
  selling_price: string;
  image_url: string | null;
  is_active: boolean;
  items: ComboItem[];
};

async function fetchCombos(): Promise<Combo[]> {
  try {
    const res = await fetch("https://silaa-erp.duckdns.org/combos/public", {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function CombosPage() {
  const combos = await fetchCombos();
  const active = combos.filter((c) => c.is_active);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-12 pb-24">
      <div className="mb-10">
        <h1 className="font-serif text-5xl sm:text-6xl mb-3">
          Combo <span className="italic text-gold">Sets</span>
        </h1>
        <p className="text-sm text-smoke">
          Curated bundles — everything you need, together at a special price.
        </p>
      </div>

      {active.length === 0 ? (
        <div className="min-h-[40vh] flex items-center justify-center text-smoke text-sm">
          No combo sets available right now. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
          {active.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      )}
    </div>
  );
}
