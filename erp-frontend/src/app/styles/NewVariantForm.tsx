"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getClientToken } from "@/lib/clientAuth";
import { Button, Input } from "@/components/ui";
import { FabricItem } from "@/lib/api";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "28", "30", "32", "34", "36", "38", "40", "42"];

export default function NewVariantForm({ styleId, fabrics }: { styleId: number; fabrics: FabricItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ sku_prefix: "", color: "", sizes: [] as string[], qty: "", fabric_item_id: "", cost_price: "" });
  const [consumptions, setConsumptions] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleSize = (s: string) => {
    setForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(s) ? prev.sizes.filter(x => x !== s) : [...prev.sizes, s]
    }));
  };

  const submit = async () => {
    if (!form.sku_prefix || !form.color || form.sizes.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const basePayload = {
        color: form.color,
        qty: form.qty ? parseInt(form.qty, 10) : 0,
        fabric_item_id: form.fabric_item_id ? parseInt(form.fabric_item_id, 10) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      };
      
      const payloads = form.sizes.map(size => {
        const consumption = consumptions[size];
        return {
          ...basePayload,
          sku_code: `${form.sku_prefix}-${size}`,
          size: size,
          fabric_consumption: consumption ? parseFloat(consumption) : null,
        };
      });
      
      await api.post(`/styles/${styleId}/variants/bulk`, payloads, getClientToken());
      
      setForm({ sku_prefix: "", color: "", sizes: [], qty: "", fabric_item_id: "", cost_price: "" });
      setConsumptions({});
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-primary cursor-pointer transition-colors duration-150 mt-2"
      >
        <Plus size={12} /> Add variant(s)
      </button>
    );
  }

  return (
    <div className="mt-3 p-4 rounded-lg bg-muted/30 border border-border">
      <h4 className="text-sm font-medium mb-3">Bulk Add Variants</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">SKU Prefix</label>
          <Input
            placeholder="e.g. OXF-WHT"
            value={form.sku_prefix}
            onChange={(e) => setForm({ ...form, sku_prefix: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Color</label>
          <Input
            placeholder="e.g. White"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Starting Qty (per size)</label>
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Cost Price</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 500"
            value={form.cost_price}
            onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-4">
          <label className="text-xs text-muted-foreground">Fabric</label>
          <select
            value={form.fabric_item_id}
            onChange={(e) => setForm({ ...form, fabric_item_id: e.target.value })}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select fabric</option>
            {fabrics?.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="text-xs text-muted-foreground block mb-2">Select Sizes to Generate</label>
        <div className="flex flex-wrap gap-2">
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => toggleSize(s)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                form.sizes.includes(s) 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      
      {form.sizes.length > 0 && (
        <div className="mb-4">
          <label className="text-xs text-muted-foreground block mb-2">Fabric Consumption (m per piece)</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {form.sizes.map(s => (
              <div key={s} className="flex flex-col gap-1 bg-background p-2 rounded border border-border">
                <label className="text-xs font-semibold">Size {s}</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 1.5"
                  value={consumptions[s] || ""}
                  onChange={(e) => setConsumptions({ ...consumptions, [s]: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={submit} disabled={saving || !form.sku_prefix || !form.color || form.sizes.length === 0}>
          {saving ? "Saving…" : "Save variants"}
        </Button>
        <Button variant="ghost" onClick={() => { setOpen(false); setError(null); }}>Cancel</Button>
        {error && <p className="text-xs text-destructive self-center">{error}</p>}
      </div>
    </div>
  );
}
