import { requireAuth } from "@/lib/serverAuth";
import NewPOForm from "./NewPOForm";
import POClient from "./POClient";

export default async function PurchaseOrdersPage() {
  const token = await requireAuth();
  return (
    <main className="max-w-5xl mx-auto px-8 py-10">
      <NewPOForm token={token} />
      <POClient token={token} />
    </main>
  );
}
