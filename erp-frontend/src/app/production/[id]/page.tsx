import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api, CostBreakdown, ProductionEvent, ProductionOrder } from "@/lib/api";
import { Card, StatusPill } from "@/components/ui";
import { requireAuth } from "@/lib/serverAuth";
import { notFound } from "next/navigation";
import ProductionOrderDetail, {
  CuttingRecord,
  StitchingBatch,
  VariantBreakdown,
} from "./ProductionOrderDetail";

const ZERO_COST: CostBreakdown = {
  fabric_cost: "0.00",
  accessory_cost: "0.00",
  labor_cost: "0.00",
  total_cost: "0.00",
  qty_passed: "0",
  unit_cost: null,
};

export default async function ProductionOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await requireAuth();

  const [order, variants, cuttingRecords, batches, events, cost] = await Promise.all([
    api.get<ProductionOrder>(`/production-orders/${id}`, token).catch(() => null),
    api.get<VariantBreakdown[]>(`/production-orders/${id}/variants`, token).catch(() => null),
    api.get<CuttingRecord[]>(`/production-orders/${id}/cutting-records`, token).catch(() => null),
    api.get<StitchingBatch[]>(`/production-orders/${id}/stitching-batches`, token).catch(() => null),
    api.get<ProductionEvent[]>(`/production-orders/${id}/events`, token).catch(() => null),
    api.get<CostBreakdown>(`/production-orders/${id}/cost-breakdown`, token).catch(() => null),
  ]);

  if (!order) notFound();

  const c = cost ?? ZERO_COST;

  return (
    <main className="max-w-3xl mx-auto px-8 py-10">
      <Link
        href="/production"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft size={14} /> Production Orders
      </Link>
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Order #{order.id}</h1>
        <StatusPill value={order.status} />
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        Style {order.style_id} · {order.source}
      </p>

      <Card className="p-4 mb-8 grid grid-cols-2 sm:grid-cols-5 gap-4">
        <CostStat label="Fabric" value={c.fabric_cost} />
        <CostStat label="Accessory" value={c.accessory_cost} />
        <CostStat label="Labor" value={c.labor_cost} />
        <CostStat label="Total" value={c.total_cost} />
        <CostStat label="Unit cost" value={c.unit_cost ?? "—"} />
      </Card>

      <ProductionOrderDetail
        order={order}
        variants={variants ?? []}
        initialCuttingRecords={cuttingRecords ?? []}
        initialBatches={batches ?? []}
        initialEvents={events ?? []}
      />
    </main>
  );
}

function CostStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">₹{value}</p>
    </div>
  );
}
