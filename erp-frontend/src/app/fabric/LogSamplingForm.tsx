"use client";

import { useState } from "react";
import { api, decodeToken, FabricLotWithBalance } from "@/lib/api";
import { Button, Input, Select } from "@/components/ui";
import { getClientToken } from "@/lib/clientAuth";
import { Scissors } from "lucide-react";

type Props = {
  fabricItemId: number;
  lots: FabricLotWithBalance[];
  onDone: () => void;
};

export default function LogSamplingForm({ fabricItemId, lots, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [lotId, setLotId] = useState("");
  const [fabricQty, setFabricQty] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const itemLots = lots.filter(l => l.fabric_item_id === fabricItemId);

  async function handleOpen() {
    if (!open) {
      if (itemLots[0]) setLotId(itemLots[0].id.toString());
    }
    setOpen(o => !o);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lotId || !fabricQty) {
      setErr("All fields required");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      const token = getClientToken();
      const createdBy = token ? (decodeToken(token).sub ?? "unknown") : "unknown";
      await api.post(`/fabric-lots/${lotId}/issue`, {
        qty: parseFloat(fabricQty),
        reference_type: "sampling",
        created_by: createdBy,
      }, token);
      
      setOpen(false);
      setFabricQty("");
      setLotId("");
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  if (itemLots.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={handleOpen}
        className="text-sm text-accent hover:underline flex items-center gap-1"
      >
        <Scissors size={14} />
        {open ? "Cancel" : "+ Log sampling (deduct)"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-3 p-4 bg-muted/30 rounded-lg border border-border flex flex-col gap-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deduct fabric for sampling</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fabric Lot</label>
              <Select value={lotId} onChange={e => setLotId(e.target.value)}>
                {itemLots.map(l => (
                  <option key={l.id} value={l.id}>
                    Lot #{l.id} — {l.balance} m available
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Qty Used (m)</label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="e.g. 5"
                value={fabricQty}
                onChange={e => setFabricQty(e.target.value)}
              />
            </div>
          </div>

          {err && <p className="text-sm text-destructive">{err}</p>}

          <div className="flex justify-end gap-2 mt-1">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !fabricQty}>
              {saving ? "Saving..." : "Log Sampling"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
