"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { PurchaseOrder, Supplier, api, ApiError } from "@/lib/api";
import { useERP } from "@/lib/useERP";
import { PageHeader, StatusPill, Card } from "@/components/ui";
import { getClientToken } from "@/lib/clientAuth";
import ApproveButton from "./ApproveButton";
import EditPOForm from "./EditPOForm";

type SupplierBlocker = { supplierId: number; poIds: number[]; fabricLotIds: number[]; accessoryLotIds: number[] };

type Props = { token: string };

export default function POClient({ token }: Props) {
  const { data: orders = [] } = useERP<PurchaseOrder[]>("/purchase-orders", token);
  const { data: suppliers = [] } = useERP<Supplier[]>("/suppliers", token);
  const router = useRouter();
  const [supplierBlocker, setSupplierBlocker] = useState<SupplierBlocker | null>(null);
  const supplierName = (id: number) => suppliers.find((s) => s.id === id)?.name ?? `#${id}`;

  async function handleDeleteSupplier(s: Supplier) {
    if (!confirm(`Delete supplier "${s.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/suppliers/${s.id}`, getClientToken());
      setSupplierBlocker(null);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const d = err.detail as { po_ids?: number[]; fabric_lot_ids?: number[]; accessory_lot_ids?: number[] };
        setSupplierBlocker({
          supplierId: s.id,
          poIds: d?.po_ids ?? [],
          fabricLotIds: d?.fabric_lot_ids ?? [],
          accessoryLotIds: d?.accessory_lot_ids ?? [],
        });
        return;
      }
      const msg = err instanceof Error ? err.message.replace(/^\d+ [^:]+: /, "") : "Delete failed";
      alert(msg);
    }
  }

  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle={`${orders.length} order${orders.length === 1 ? "" : "s"}`} />
      {/* Purchase Orders */}
      {orders.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm mt-6">No purchase orders yet.</Card>
      ) : (
        <div className="flex flex-col gap-3 mt-6">
          {orders.map((po) => (
            <Card key={po.id} className="px-5 py-4 flex items-center justify-between group hover:border-accent hover:shadow-sm transition-all duration-200">
              <div className="flex items-center gap-5">
                {po.image_url ? (
                  <div className="w-14 h-14 relative rounded-md overflow-hidden bg-muted border border-border shrink-0">
                    <img src={po.image_url} alt={`PO #${po.id}`} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-md bg-muted border border-border flex items-center justify-center shrink-0">
                    <span className="text-xs text-muted-foreground font-medium">No Img</span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/purchase-orders/${po.id}`} className="font-medium text-foreground hover:text-accent transition-colors">
                      Order #{po.id}
                    </Link>
                    <span className="text-muted-foreground font-normal">·</span>
                    <Link href={`/purchase-orders/${po.id}`} className="text-sm font-medium hover:text-accent transition-colors">
                      {supplierName(po.supplier_id)}
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-sm truncate">
                    {po.description || "No description provided"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dispatch: {po.dispatch_date || "Pending"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <StatusPill value={po.status} />
                <div className="flex items-center gap-2">
                  {po.status === "draft" && (
                    <>
                      <ApproveButton poId={po.id} />
                      <EditPOForm po={po} suppliers={suppliers} onSaved={() => router.refresh()} />
                    </>
                  )}
                  <button
                    onClick={async () => {
                      let msg = `Delete Order #${po.id}? This cannot be undone.`;
                      if (po.status !== "draft") {
                          msg = `WARNING: Order #${po.id} is ${po.status}. Deleting it will also delete all of its line items. Any inventory already received against it will lose its PO reference. Are you absolutely sure?`;
                      }
                      if (!confirm(msg)) return;
                      try {
                        await api.delete(`/purchase-orders/${po.id}`, getClientToken());
                        router.refresh();
                      } catch (err) {
                        const errMsg = err instanceof Error ? err.message.replace(/^\d+ [^:]+: /, "") : "Delete failed";
                        alert(errMsg);
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                    title={po.status !== "draft" ? "Delete order (Warning: Destructive)" : "Delete order"}
                  >
                    <Trash2 size={15} />
                  </button>
                  <Link href={`/purchase-orders/${po.id}`} className="text-muted-foreground hover:text-foreground transition-colors ml-2">
                    <ExternalLink size={16} />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Suppliers */}
      <div className="mt-10">
        <h2 className="text-sm font-medium text-foreground mb-3">Suppliers</h2>
        <div className="flex flex-col gap-2">
          {suppliers.map((s) => (
            <div key={s.id}>
              <Card className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s.type}</p>
                </div>
                <button
                  onClick={() => handleDeleteSupplier(s)}
                  className="text-muted-foreground hover:text-destructive cursor-pointer transition-colors p-1"
                  title="Delete supplier"
                >
                  <Trash2 size={15} />
                </button>
              </Card>
              {supplierBlocker?.supplierId === s.id && (
                <div className="mt-1 px-4 py-2 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                  <span className="font-medium">Cannot delete — used in:</span>
                  {supplierBlocker.poIds.length > 0 && (
                    <span className="ml-1">
                      Purchase Orders:{" "}
                      {supplierBlocker.poIds.map((id, i) => (
                        <span key={id}>
                          {i > 0 && ", "}
                          <Link href={`/purchase-orders/${id}`} className="underline font-medium hover:text-destructive/80">
                            PO #{id}
                          </Link>
                        </span>
                      ))}
                    </span>
                  )}
                  {supplierBlocker.fabricLotIds.length > 0 && (
                    <span className="ml-1">· Fabric Lots: {supplierBlocker.fabricLotIds.map((id) => `#${id}`).join(", ")}</span>
                  )}
                  {supplierBlocker.accessoryLotIds.length > 0 && (
                    <span className="ml-1">· Accessory Lots: {supplierBlocker.accessoryLotIds.map((id) => `#${id}`).join(", ")}</span>
                  )}
                  <span className="ml-1 text-muted-foreground">— delete those first, then retry.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
