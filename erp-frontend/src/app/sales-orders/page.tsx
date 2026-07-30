import { api, OrderMarginTotal, SalesOrder } from "@/lib/api";
import { requireAuth } from "@/lib/serverAuth";
import InvoicesPageClient from "./InvoicesPageClient";

export default async function SalesOrdersPage() {
  const token = await requireAuth();
  const [_orders, _margins] = await Promise.all([
    api.get<SalesOrder[]>("/sales-orders", token).catch(() => null),
    api.get<OrderMarginTotal[]>("/sales-orders/margins", token).catch(() => null),
  ]);
  const orders = _orders || [];
  const margins = _margins || [];

  return (
    <main className="max-w-5xl mx-auto px-8 py-10">
      <InvoicesPageClient orders={orders} margins={margins} />
    </main>
  );
}
