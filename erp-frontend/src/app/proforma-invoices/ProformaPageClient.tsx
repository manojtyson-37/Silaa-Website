"use client";

import { useState, useEffect } from "react";
import { Plus, FileText, Clock, CheckCircle, XCircle, Send, Banknote, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProformaInvoice, ProformaStatus, api } from "@/lib/api";
import { getClientToken } from "@/lib/clientAuth";
import { Card } from "@/components/ui";
import ProformaForm from "./ProformaForm";

type Props = { invoices: ProformaInvoice[] };

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

export default function ProformaPageClient({ invoices: initial }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [invoices, setInvoices] = useState(initial);
  const [transitioning, setTransitioning] = useState<number | null>(null);

  useEffect(() => { setInvoices(initial); }, [initial]);

  const handleTransition = async (id: number, next: ProformaStatus) => {
    setTransitioning(id);
    try {
      const token = getClientToken();
      await api.post(`/proforma-invoices/${id}/status`, { status: next }, token);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setTransitioning(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this proforma invoice?")) return;
    try {
      const token = getClientToken();
      await api.delete(`/proforma-invoices/${id}`, token);
      setInvoices(prev => prev.filter(p => p.id !== id));
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
          onClose={() => { setShowForm(false); setEditId(null); router.refresh(); }}
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
                        onClick={() => handleTransition(pi.id, transition.next)}
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
                    {(pi.status === "draft" || pi.status === "cancelled") && (
                      <button
                        onClick={() => handleDelete(pi.id)}
                        className="text-xs px-3 py-1.5 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </>
  );
}
