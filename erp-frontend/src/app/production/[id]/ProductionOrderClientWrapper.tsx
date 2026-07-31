"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useERP } from "@/lib/useERP";
import { CostBreakdown, ProductionEvent, ProductionOrder } from "@/lib/api";
import { Card, StatusPill } from "@/components/ui";
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

function CostStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">₹{value}</p>
    </div>
  );
}

export function ProductionOrderClientWrapper({ id, token }: { id: string; token: string }) {
  const { data: order, error: orderError } = useERP<ProductionOrder>(`/production-orders/${id}`, token);
  const { data: variants = [] } = useERP<VariantBreakdown[]>(`/production-orders/${id}/variants`, token);
  const { data: cuttingRecords = [] } = useERP<CuttingRecord[]>(`/production-orders/${id}/cutting-records`, token);
  const { data: batches = [] } = useERP<StitchingBatch[]>(`/production-orders/${id}/stitching-batches`, token);
  const { data: events = [] } = useERP<ProductionEvent[]>(`/production-orders/${id}/events`, token);
  const { data: cost } = useERP<CostBreakdown>(`/production-orders/${id}/cost-breakdown`, token);

  const c = cost ?? ZERO_COST;

  if (orderError) {
    return (
      <main className="max-w-3xl mx-auto px-8 py-10">
        <Link
          href="/production"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={14} /> Production Orders
        </Link>
        <p className="text-muted-foreground">Production order not found.</p>
      </main>
    );
  }

  if (!order) {
    // Loading — render minimal shell to avoid layout shift
    return (
      <main className="max-w-3xl mx-auto px-8 py-10">
        <Link
          href="/production"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={14} /> Production Orders
        </Link>
        <div className="h-7 w-48 bg-muted rounded animate-pulse mb-8" />
      </main>
    );
  }

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
        variants={variants}
        initialCuttingRecords={cuttingRecords}
        initialBatches={batches}
        initialEvents={events}
      />
    </main>
  );
}
