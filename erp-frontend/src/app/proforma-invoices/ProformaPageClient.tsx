"use client";

import { useState } from "react";
import { Plus, FileText, Clock, CheckCircle, XCircle, Send, Banknote, Package } from "lucide-react";
import Link from "next/link";
import { ProformaInvoice, ProformaStatus, api } from "@/lib/api";
import { useERP } from "@/lib/useERP";
import { getClientToken } from "@/lib/clientAuth";
import { Card } from "@/components/ui";
import ProformaForm from "./ProformaForm";

type Props = { token: string };

const STATUS_META: Record<ProformaStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  draft:        { label: "Draft",        cls: "bg-slate-100 text-slate-600 border-slate-200", icon: <Clock size={11} /> },
  sent:         { label: "Sent",         cls: "bg-blue-50 text-blue-700 border-blue-200",    icon: <Send size={11} /> },
  advance_paid: { label: "Advance Paid", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Banknote size={11} /> },
  balance_paid: { label: "Balance Paid", cls: "bg-purple-50 text-purple-700 border-purple-200", icon: <Banknote size={11} /> },
  completed:    { label: "Completed",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle size={11} /> },
  cancelled:    { label: "Cancelled",    cls: "bg-red-50 text-red-600 border-red-200",        icon: <XCircle size={11} /> },
};

const EDITABLE_STATUSES: ProformaStatus[] = ["draft", "sent"];
const TRANSITION_LABELS: Partial<Record<ProformaStatus, { next: ProformaStatus; label: string }>> = {
  draft:        { next: "sent",         label: "Mark Sent" },
  sent:         { next: "advance_paid", label: "Advance Paid" },
  advance_paid: { next: "balance_paid", label: "Balance Paid" },
  balance_paid: { next: "completed",    label: "Mark Completed" },
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtAmt(s: string) {
  const n = Number(s);
  if (!n) return "—";
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ProformaPageClient({ token }: Props) {
  const { data: invoices = [], mutate } = useERP<ProformaInvoice[]>("/proforma-invoices", token);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState<number | null>(null);
  const [paymentAction, setPaymentAction] = useState<{ id: number, next: ProformaStatus } | null>(null);
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [paymentNotes, setPaymentNotes] = useState("");

  const handleTransition = async (id: number, next: ProformaStatus, pMode?: string, pNotes?: string) => {
    setTransitioning(id);
    try {
      const tok = getClientToken();
      const payload: any = { status: next };
      if (pMode) payload.payment_mode = pMode;
      if (pNotes) payload.payment_notes = pNotes;
      await api.post(`/proforma-invoices/${id}/status`, payload, tok);
      mutate();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setTransitioning(null);
      setPaymentAction(null);
    }
  };

  const handleActionClick = (id: number, next: ProformaStatus) => {
    if (next === "advance_paid" || next === "balance_paid") {
      setPaymentMode("UPI");
      setPaymentNotes("");
      setPaymentAction({ id, next });
    } else {
      handleTransition(id, next);
    }
  };

  const handleDelete = async (id: number, status: string) => {
    const isDeletable = status === "draft" || status === "cancelled";
    const msg = isDeletable
      ? "Delete this proforma invoice? This cannot be undone."
      : "This invoice is not in Draft/Cancelled status. It will be cancelled first, then deleted. Continue?";
    if (!confirm(msg)) return;
    try {
      const tok = getClientToken();
      // Cancel first if not already in a deletable status
      if (!isDeletable) {
        await api.post(`/proforma-invoices/${id}/status`, { status: "cancelled" }, tok);
      }
      await api.delete(`/proforma-invoices/${id}`, tok);
      mutate();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <>
      {!showForm && editId === null && (
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Proforma Invoices</h1>
            <p className="text-sm text-muted-foreground mt-0.5">B2B bulk job-work orders — track advance and balance payments</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors cursor-pointer shrink-0"
          >
            <Plus size={14} /> New Proforma
          </button>
        </div>
      )}

      {(showForm || editId !== null) && (
        <ProformaForm
          editId={editId ?? undefined}
          onClose={() => { setShowForm(false); setEditId(null); mutate(); }}
        />
      )}

      {!showForm && editId === null && (
        <div className="flex flex-col gap-3 mt-2">
          {invoices.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground text-sm">
              No proforma invoices yet. Create one to start a bulk job-work order.
            </Card>
          ) : (
            invoices.map((pi) => {
              const meta = STATUS_META[pi.status] ?? STATUS_META.draft;
              const transition = TRANSITION_LABELS[pi.status];
              const canEdit = EDITABLE_STATUSES.includes(pi.status);
              return (
                <Card key={pi.id} className="px-5 py-4 flex items-center justify-between group hover:border-accent hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center gap-5 min-w-0">
                    <div className="w-12 h-12 rounded-md bg-muted border border-border flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {pi.invoice_number ?? `PI-${pi.id}`}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                          {pi.customer_name}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${meta.cls}`}>
                          {meta.icon}{meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {pi.lines.length} style{pi.lines.length !== 1 ? "s" : ""}
                        {pi.delivery_date ? ` · Deliver by ${fmtDate(pi.delivery_date)}` : ""}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-muted-foreground">Total: <span className="font-semibold text-foreground">{fmtAmt(pi.total_amount)}</span></span>
                        <span className="text-muted-foreground">Advance: <span className="font-medium text-amber-700">{fmtAmt(pi.advance_amount)}</span></span>
                        <span className="text-muted-foreground">Balance: <span className="font-medium">{fmtAmt(pi.balance_amount)}</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {transition && (
                      <button
                        onClick={() => handleActionClick(pi.id, transition.next)}
                        disabled={transitioning === pi.id}
                        className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent font-medium hover:bg-accent/20 transition-colors disabled:opacity-50"
                      >
                        {transitioning === pi.id ? "…" : transition.label}
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => setEditId(pi.id)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    <Link
                      href={`/proforma-invoices/${pi.id}/print`}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
                    >
                      View / Print
                    </Link>
                    <button
                        onClick={() => handleDelete(pi.id, pi.status)}
                        className="text-xs px-3 py-1.5 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Delete
                      </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {paymentAction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-surface shadow-2xl relative">
            <button
              onClick={() => setPaymentAction(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <XCircle size={20} />
            </button>
            <h3 className="text-lg font-bold mb-4">
              {paymentAction.next === "advance_paid" ? "Record Advance Payment" : "Record Balance Payment"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Payment Mode</label>
                <select
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Notes / UTR No.</label>
                <input
                  type="text"
                  placeholder="e.g. UTR 123456789"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  className="flex-1 bg-accent text-white py-2 rounded-lg text-sm font-semibold hover:bg-accent/90 disabled:opacity-50"
                  disabled={transitioning !== null}
                  onClick={() => handleTransition(paymentAction.id, paymentAction.next, paymentMode, paymentNotes)}
                >
                  {transitioning ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
