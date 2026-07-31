import { requireAuth } from "@/lib/serverAuth";
import ProductionClient from "./ProductionClient";

export default async function ProductionListPage() {
  const token = await requireAuth();
  return (
    <main className="max-w-5xl mx-auto px-8 py-10">
      <ProductionClient token={token} />
    </main>
  );
}
