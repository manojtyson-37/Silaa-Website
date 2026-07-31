"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Upload, X, FileText } from "lucide-react";
import { api, ProformaInvoice, INDIAN_STATES } from "@/lib/api";
import { getClientToken } from "@/lib/clientAuth";
import { Button, Input, Select } from "@/components/ui";

const SIZES = ["S", "M", "L", "XL", "XXL"];

type SizeMap = Record<string, number>;

type Line = {
  style_name: string;
  description: string;
  photo_url: string;
  unit_price: string;
  sizes: SizeMap;
};

function emptyLine(): Line {
  return { style_name: "", description: "", photo_url: "", unit_price: "", sizes: {} };
}

function lineTotalQty(l: Line) {
  return Object.values(l.sizes).reduce((s, v) => s + (Number(v) || 0), 0);
}

function lineAmount(l: Line) {
  return lineTotalQty(l) * (parseFloat(l.unit_price) || 0);
}

type Props = { editId?: number; onClose: () => void };

export default function ProformaForm({ editId, onClose }: Props) {
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);

  // Customer fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerState, setCustomerState] = useState("");

  // Order fields
  const [deliveryDate, setDeliveryDate] = useState("");
  const [description, setDescription] = useState("");
  const [advancePercent, setAdvancePercent] = useState("50");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [showTerms, setShowTerms] = useState(false);

  const [lines, setLines] = useState<Line[]>([emptyLine()]);

  useEffect(() => {
    if (!editId) return;
    const token = getClientToken();
    api.get<ProformaInvoice>(`/proforma-invoices/${editId}`, token)
      .then(data => {
        setCustomerName(data.customer_name);
        setCustomerPhone(data.customer_phone || "");
        setCustomerEmail(data.customer_email || "");
        setCustomerAddress(data.customer_address || "");
        setCustomerGstin(data.customer_gstin || "");
        setCustomerState(data.customer_state || "");
        setDeliveryDate(data.delivery_date ? data.delivery_date.slice(0, 10) : "");
        setDescription(data.description || "");
        setAdvancePercent(String(Number(data.advance_percent) || 50));
        setTermsAndConditions(data.terms_and_conditions || "");
        setLines(data.lines.map(l => ({
          style_name: l.style_name,
          description: l.description || "",
          photo_url: l.photo_url || "",
          unit_price: String(Number(l.unit_price)),
          sizes: { ...l.sizes },
        })));
      })
      .catch(() => setError("Failed to load proforma"))
      .finally(() => setLoading(false));
  }, [editId]);

  const updateLine = (i: number, patch: Partial<Line>) =>
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));

  const updateSize = (lineIdx: number, size: string, val: string) => {
    const n = parseInt(val) || 0;
    setLines(prev => prev.map((l, idx) => {
      if (idx !== lineIdx) return l;
      const sizes = { ...l.sizes };
      if (n > 0) sizes[size] = n;
      else delete sizes[size];
      return { ...l, sizes };
    }));
  };

  const handlePhotoUpload = async (lineIdx: number, file: File) => {
    setUploading(lineIdx);
    try {
      const token = getClientToken();
      const data = await api.upload(file, token ?? undefined);
      updateLine(lineIdx, { photo_url: data.url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const grandTotal = lines.reduce((sum, l) => sum + lineAmount(l), 0);
  const advanceAmt = grandTotal * (parseFloat(advancePercent) / 100);
  const balanceAmt = grandTotal - advanceAmt;

  const submit = async () => {
    if (!customerName.trim()) { setError("Customer name required"); return; }
    const validLines = lines.filter(l => l.style_name.trim() && parseFloat(l.unit_price) > 0);
    if (validLines.length === 0) { setError("Add at least one line with a style name and price"); return; }

    setSaving(true);
    setError(null);
    try {
      const token = getClientToken();
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone || null,
        customer_email: customerEmail || null,
        customer_address: customerAddress || null,
        customer_gstin: customerGstin || null,
        customer_state: customerState || null,
        delivery_date: deliveryDate || null,
        description: description || null,
        advance_percent: parseFloat(advancePercent) || 50,
        terms_and_conditions: termsAndConditions || null,
        lines: validLines.map(l => ({
          style_name: l.style_name.trim(),
          description: l.description || null,
          photo_url: l.photo_url || null,
          unit_price: parseFloat(l.unit_price),
          sizes: l.sizes,
        })),
      };

      if (editId) {
        await api.patch(`/proforma-invoices/${editId}`, payload, token);
      } else {
        await api.post("/proforma-invoices", payload, token);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 border border-border rounded-xl bg-surface shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-accent" />
          <span className="text-sm font-semibold text-foreground">
            {editId ? `Edit Proforma Invoice #${editId}` : "New Proforma Invoice"}
          </span>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-muted-foreground text-sm">Loading…</div>
      ) : (
        <div className="p-6 flex flex-col gap-8">

          {/* ── Customer ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Client Details</p>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Client / Company name *" value={customerName} onChange={e => setCustomerName(e.target.value)} />
              <Input placeholder="Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
              <Input placeholder="Email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
              <Input placeholder="GSTIN (optional)" value={customerGstin} onChange={e => setCustomerGstin(e.target.value)} />
              <Input placeholder="Address" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="col-span-2" />
              <Select value={customerState} onChange={e => setCustomerState(e.target.value)}>
                <option value="">State (for GST)</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
          </section>

          {/* ── Order Info ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Order Details</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Delivery Date</label>
                <Input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Advance %</label>
                <Input type="number" min="0" max="100" value={advancePercent} onChange={e => setAdvancePercent(e.target.value)} />
              </div>
              <div className="col-span-3">
                <Input placeholder="Description / special instructions (optional)" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>
          </section>

          {/* ── Line Items ── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Styles / Items</p>
            <div className="flex flex-col gap-4">
              {lines.map((line, i) => (
                <div key={i} className="border border-border rounded-lg p-4 bg-muted/20 relative">
                  {lines.length > 1 && (
                    <button
                      onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <Input
                      placeholder="Style / Fabric name *"
                      value={line.style_name}
                      onChange={e => updateLine(i, { style_name: e.target.value })}
                      className="col-span-2"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price per piece (₹) *"
                      value={line.unit_price}
                      onChange={e => updateLine(i, { unit_price: e.target.value })}
                    />
                    <Input
                      placeholder="Description (e.g. Cotton kurta, collar style)"
                      value={line.description}
                      onChange={e => updateLine(i, { description: e.target.value })}
                      className="col-span-3"
                    />
                  </div>

                  {/* Size-wise qty */}
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-2">Size-wise quantity</p>
                    <div className="flex gap-2 flex-wrap">
                      {SIZES.map(size => (
                        <div key={size} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{size}</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={line.sizes[size] || ""}
                            onChange={e => updateSize(i, size, e.target.value)}
                            placeholder="0"
                            className="w-14 text-center text-sm border border-border rounded-md px-1 py-1.5 bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                          />
                        </div>
                      ))}
                      <div className="flex flex-col items-center justify-end gap-1 ml-2">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
                        <div className="w-14 text-center text-sm font-semibold text-foreground bg-muted border border-border rounded-md px-1 py-1.5">
                          {lineTotalQty(line)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Photo upload */}
                  <div className="flex items-center gap-3">
                    {line.photo_url ? (
                      <div className="flex items-center gap-2">
                        <img src={line.photo_url} alt="style" className="w-12 h-12 object-cover rounded border border-border" />
                        <button onClick={() => updateLine(i, { photo_url: "" })} className="text-destructive/70 hover:text-destructive">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent cursor-pointer border border-dashed border-border rounded-md px-3 py-2 hover:border-accent transition-colors">
                        <Upload size={13} />
                        {uploading === i ? "Uploading…" : "Add style photo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading !== null}
                          onChange={e => { if (e.target.files?.[0]) handlePhotoUpload(i, e.target.files[0]); }}
                        />
                      </label>
                    )}
                    {line.unit_price && lineTotalQty(line) > 0 && (
                      <span className="ml-auto text-sm font-semibold text-foreground">
                        ₹{lineAmount(line).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setLines(prev => [...prev, emptyLine()])}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
              >
                <Plus size={13} /> Add another style
              </button>
            </div>
          </section>

          {/* ── Totals ── */}
          {grandTotal > 0 && (
            <div className="flex justify-end">
              <div className="w-72 text-sm space-y-2 border border-border rounded-lg p-4 bg-muted/20">
                <div className="flex justify-between text-muted-foreground">
                  <span>Grand Total</span>
                  <span className="font-semibold text-foreground">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-amber-700 border-t border-border/50 pt-2">
                  <span>Advance ({advancePercent}%)</span>
                  <span className="font-semibold">₹{advanceAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Balance on delivery</span>
                  <span className="font-medium">₹{balanceAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Terms & Conditions ── */}
          <section>
            <button
              type="button"
              onClick={() => setShowTerms(v => !v)}
              className="text-xs text-accent hover:text-accent/80 font-medium transition-colors"
            >
              {showTerms ? "Hide" : "Edit"} Terms & Conditions
            </button>
            {showTerms && (
              <textarea
                value={termsAndConditions}
                onChange={e => setTermsAndConditions(e.target.value)}
                rows={8}
                placeholder="Terms and conditions (default terms applied automatically on save)"
                className="mt-2 w-full text-xs border border-border rounded-lg px-3 py-2 bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-y"
              />
            )}
          </section>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 border-t border-border pt-4">
            <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : editId ? "Update Proforma" : "Create Proforma"}</Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
