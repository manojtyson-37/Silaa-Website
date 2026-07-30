"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getClientToken } from "@/lib/clientAuth";
import { Button, Input } from "@/components/ui";

export default function AddCustomerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/customers`, form, getClientToken());
      setForm({ name: "", email: "", phone: "", address: "" });
      setOpen(false);
      // Best-effort cache bust: the 30s revalidate window self-heals regardless,
      // so a failure here must never block the already-successful create above.
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: "customers" }),
      }).catch(() => {});
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="flex items-center gap-1">
        <Plus size={16} /> Add Customer
      </Button>
    );
  }

  return (
    <div className="mb-4 p-4 rounded-lg bg-muted/30 border border-border">
      <h4 className="text-sm font-medium mb-3">Add Customer</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Name *</label>
          <Input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. John Doe"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Email</label>
          <Input
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="e.g. john@example.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Phone</label>
          <Input
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. +919876543210"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Address</label>
          <Input
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            placeholder="e.g. 123 Main St, City"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={submit} disabled={!form.name || saving}>
          {saving ? "Saving..." : "Save Customer"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
          Cancel
        </Button>
        {error && <p className="text-xs text-destructive self-center">{error}</p>}
      </div>
    </div>
  );
}
