import { api, PurchaseOrder, Supplier } from "@/lib/api";
import { PageHeader } from "@/components/ui";
import NewPOForm from "./NewPOForm";
import POClient from "./POClient";
import { requireAuth } from "@/lib/serverAuth";

export default async function PurchaseOrdersPage() {
  const token = await requireAuth();
  const [_orders, _suppliers] = await Promise.all([
    api.get<PurchaseOrder[]>("/purchase-orders", token).catch(() => null),
    api.get<Supplier[]>("/suppliers", token).catch(() => null),
  ]);
  const orders = _orders || [];
  const suppliers = _suppliers || [];

  return (
    <main className="max-w-5xl mx-auto px-8 py-10">
      <PageHeader title="Purchase Orders" subtitle={`${orders.length} order${orders.length === 1 ? "" : "s"}`} />

      <NewPOForm suppliers={suppliers} />

      <POClient orders={orders} suppliers={suppliers} />
    </main>
  );
}
