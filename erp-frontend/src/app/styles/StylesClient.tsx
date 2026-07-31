"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { StyleWithVariants, FabricItem, api } from "@/lib/api";
import { useERP } from "@/lib/useERP";
import { getClientToken } from "@/lib/clientAuth";
import { PageHeader, Card, Table, Th } from "@/components/ui";
import EditStyleForm from "./EditStyleForm";
import NewVariantForm from "./NewVariantForm";
import EditVariantRow from "./EditVariantRow";

type Props = { token: string };

export default function StylesClient({ token }: Props) {
  const { data: stylesWithVariants = [] } = useERP<StyleWithVariants[]>("/styles-with-variants", token);
  const { data: fabrics = [] } = useERP<FabricItem[]>("/fabric-items", token);
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Styles & Variants"
        subtitle={`${stylesWithVariants.length} style${stylesWithVariants.length === 1 ? "" : "s"}`}
      />
      <div className="flex flex-col gap-5">
        {stylesWithVariants.map((style) => (
          <Card key={style.id} className="p-5">
            <div className="flex gap-4 mb-3">
              {style.image_url && (
                <img
                  src={style.image_url}
                  alt={style.name}
                  className="w-20 h-20 object-cover rounded-lg shrink-0 border border-border"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium text-foreground">{style.name}</h2>
                    <EditStyleForm style={style} onSaved={() => router.refresh()} />
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete style "${style.name}"? This will permanently delete all of its variants and BOMs. This cannot be undone.`)) return;
                      try {
                        await api.delete(`/styles/${style.id}`, getClientToken());
                        router.refresh();
                      } catch (err) {
                        const msg = err instanceof Error ? err.message.replace(/^\d+ [^:]+: /, "") : "Delete failed";
                        alert(msg);
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                    title="Delete Style"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {style.category} · {style.collection}
                </p>
              </div>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>SKU</Th>
                  <Th>Color</Th>
                  <Th>Size</Th>
                  <Th>Qty</Th>
                  <Th>Fabric</Th>
                  <Th>Consumption</Th>
                  <Th>Cost Price (₹)</Th>
                  <Th>Status</Th>
                  <Th> </Th>
                </tr>
              </thead>
              <tbody>
                {style.variants.map((v) => (
                  <EditVariantRow key={v.id} v={v} fabrics={fabrics} />
                ))}
              </tbody>
            </Table>
            <NewVariantForm styleId={style.id} fabrics={fabrics} />
          </Card>
        ))}
      </div>
    </>
  );
}
