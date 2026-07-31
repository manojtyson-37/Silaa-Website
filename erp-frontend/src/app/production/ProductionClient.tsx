"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { ProductionOrder, StyleWithVariants, api } from "@/lib/api";
import { useERP } from "@/lib/useERP";
import { getClientToken } from "@/lib/clientAuth";
import { PageHeader, Button, Card, StatusPill } from "@/components/ui";
import NewProductionOrderForm from "./NewProductionOrderForm";

type Props = { token: string };

export default function ProductionClient({ token }: Props) {
  const { data: orders = [] } = useERP<ProductionOrder[]>("/production-orders", token);
  const { data: styles = [] } = useERP<StyleWithVariants[]>("/styles-with-variants", token);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const getStyle = (styleId: number) => styles.find((s) => s.id === styleId);

  return (
    <>
      <PageHeader title="Production Orders" subtitle={`${orders.length} order${orders.length === 1 ? "" : "s"}`} />
      <div className="flex gap-4 mb-6">
        <Button onClick={() => setIsCreating(true)}>
          <Plus size={16} />
          New Production Order
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {orders.map((o) => {
          const style = getStyle(o.style_id);
          return (
            <Link key={o.id} href={`/production/${o.id}`}>
              <Card className="px-5 py-3.5 flex items-center justify-between hover:border-accent hover:shadow-sm transition-all duration-200">
                <div className="flex items-center gap-4">
                  {style?.image_url ? (
                    <div className="w-12 h-12 relative rounded-md overflow-hidden bg-muted border border-border shrink-0">
                      <Image
                        src={style.image_url}
                        alt={style.name || "Style image"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-md bg-muted border border-border flex items-center justify-center shrink-0">
                      <span className="text-xs text-muted-foreground font-medium">No Img</span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground text-sm flex items-center gap-2">
                      Order #{o.id}
                      <span className="text-muted-foreground font-normal">·</span>
                      <span className="text-accent">{style?.name || `Style #${o.style_id}`}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Source: {o.source}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusPill value={o.status} />
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!confirm(`Delete production order #${o.id}? This cannot be undone.`)) return;
                      try {
                        await api.delete(`/production-orders/${o.id}`, getClientToken());
                        router.refresh();
                      } catch (err) {
                        const msg = err instanceof Error ? err.message.replace(/^\d+ [^:]+: /, "") : "Delete failed";
                        alert(msg);
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                    title="Delete order"
                  >
                    <Trash2 size={15} />
                  </button>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </Card>
            </Link>
          );
        })}
        {orders.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground text-sm">No production orders yet.</Card>
        )}
      </div>

      {isCreating && (
        <NewProductionOrderForm
          styles={styles}
          onClose={() => setIsCreating(false)}
          onCreated={() => {
            setIsCreating(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
