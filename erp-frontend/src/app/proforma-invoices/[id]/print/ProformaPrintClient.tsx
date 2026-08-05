"use client";

import { useRef, useState } from "react";
import { Printer, ArrowLeft, Pencil } from "lucide-react";
import { ProformaInvoice } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProformaForm from "@/app/proforma-invoices/ProformaForm";

type Props = {
  pi: ProformaInvoice;
  settings: Record<string, string>;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "DRAFT",
  sent: "SENT TO CLIENT",
  advance_paid: "ADVANCE RECEIVED",
  balance_paid: "BALANCE RECEIVED",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function fmtAmt(s: string | number, currency = true) {
  const n = Number(s);
  const formatted = n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `₹${formatted}` : formatted;
}

export default function ProformaPrintClient({ pi, settings }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  const handlePrint = () => window.print();

  const bankLines = [
    settings.bank_name && `Bank: ${settings.bank_name}`,
    settings.bank_account && `Account No: ${settings.bank_account}`,
    settings.bank_ifsc && `IFSC: ${settings.bank_ifsc}`,
    settings.bank_upi && `UPI: ${settings.bank_upi}`,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Toolbar — hidden on print */}
      <div className="print:hidden bg-background border-b border-border px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/proforma-invoices" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={15} /> Back
        </Link>
        <span className="text-sm text-muted-foreground">|</span>
        <span className="text-sm font-medium text-foreground">{pi.invoice_number ?? `PI-${pi.id}`}</span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${pi.status === "completed" ? "bg-emerald-100 text-emerald-700" : pi.status === "cancelled" ? "bg-red-100 text-red-600" : "bg-amber-50 text-amber-700"}`}>
          {STATUS_LABEL[pi.status] ?? pi.status}
        </span>
        <button
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2 text-sm font-semibold border border-border text-foreground px-4 py-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <Pencil size={14} /> Edit
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 text-sm font-semibold bg-accent text-white px-4 py-1.5 rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Printer size={14} /> Print / Share PDF
        </button>
      </div>

      {/* Inline Edit Modal — opens ProformaForm pre-filled with this PI's data */}
      {editOpen && (
        <ProformaForm
          editId={pi.id}
          onClose={() => {
            setEditOpen(false);
            router.refresh();
          }}
        />
      )}

      {/* Invoice Document */}
      <div ref={printRef} className="max-w-3xl mx-auto my-8 print:my-0 bg-background shadow-lg print:shadow-none rounded-xl print:rounded-none p-10 print:p-8">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">PROFORMA INVOICE</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {STATUS_LABEL[pi.status] ?? pi.status}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-accent">{pi.invoice_number ?? `PI-${pi.id}`}</p>
            <p className="text-xs text-muted-foreground mt-1">Date: {fmtDate(pi.created_at)}</p>
            {pi.delivery_date && (
              <p className="text-xs text-muted-foreground">Delivery by: <span className="font-medium text-foreground">{fmtDate(pi.delivery_date)}</span></p>
            )}
          </div>
        </div>

        {/* Seller + Buyer */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">From</p>
            <p className="font-bold text-foreground text-sm">Silaa Collective</p>
            {settings.business_address && <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">{settings.business_address}</p>}
            {settings.gstin && <p className="text-xs text-muted-foreground mt-0.5">GSTIN: {settings.gstin}</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Bill To</p>
            <p className="font-bold text-foreground text-sm">{pi.customer_name}</p>
            {pi.customer_phone && <p className="text-xs text-muted-foreground">{pi.customer_phone}</p>}
            {pi.customer_email && <p className="text-xs text-muted-foreground">{pi.customer_email}</p>}
            {pi.customer_address && <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">{pi.customer_address}</p>}
            {pi.customer_state && <p className="text-xs text-muted-foreground">State: {pi.customer_state}</p>}
            {pi.customer_gstin && <p className="text-xs text-muted-foreground">GSTIN: {pi.customer_gstin}</p>}
          </div>
        </div>

        {pi.description && (
          <div className="mb-6 p-3 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Order Notes</p>
            <p className="text-sm text-foreground">{pi.description}</p>
          </div>
        )}

        {/* Line Items */}
        <div className="mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground w-5">#</th>
                <th className="text-left py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Style / Description</th>
                <th className="text-center py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sizes (Qty)</th>
                <th className="text-right py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground w-16">Total Qty</th>
                <th className="text-right py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground w-24">Rate</th>
                <th className="text-right py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {pi.lines.map((line, i) => {
                const sizeEntries = Object.entries(line.sizes).filter(([, qty]) => qty > 0);
                return (
                  <tr key={line.id} className="border-b border-border/50">
                    <td className="py-3 text-xs text-muted-foreground align-top">{i + 1}</td>
                    <td className="py-3 align-top">
                      <div className="flex gap-3">
                        {line.photo_url && (
                          <img src={line.photo_url} alt={line.style_name} className="w-14 h-14 object-cover rounded border border-border shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-foreground">{line.style_name}</p>
                          {line.description && <p className="text-xs text-muted-foreground mt-0.5">{line.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center align-top">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {sizeEntries.length > 0
                          ? sizeEntries.map(([size, qty]) => (
                              <span key={size} className="inline-flex items-center gap-0.5 text-xs bg-muted px-2 py-0.5 rounded font-medium">
                                {size}: {qty}
                              </span>
                            ))
                          : <span className="text-xs text-muted-foreground">—</span>
                        }
                      </div>
                    </td>
                    <td className="py-3 text-right text-sm font-medium align-top">{Number(line.total_qty)}</td>
                    <td className="py-3 text-right text-sm align-top">{fmtAmt(line.unit_price)}</td>
                    <td className="py-3 text-right text-sm font-semibold align-top">{fmtAmt(line.line_total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Taxable Amount</span>
              <span className="font-semibold text-foreground">{fmtAmt(pi.taxable_amount)}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-border/50 pb-2">
              <span className="text-muted-foreground">Total GST</span>
              <span className="font-semibold text-foreground">{fmtAmt(pi.total_gst_amount)}</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-t-2 border-border">
              <span className="font-bold text-foreground">Grand Total</span>
              <span className="font-bold text-foreground">{fmtAmt(pi.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
              <span className="font-semibold">Advance ({Number(pi.advance_percent)}%)</span>
              <span className="font-bold">{fmtAmt(pi.advance_amount)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground px-3 py-2">
              <span>Balance on delivery</span>
              <span className="font-semibold text-foreground">{fmtAmt(pi.balance_amount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Receipts */}
        {(pi.advance_payment_mode || pi.balance_payment_mode) && (
          <div className="mb-8 border border-border rounded-lg p-4 bg-muted/10">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Payment Receipts</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {pi.advance_payment_mode && (
                <div>
                  <p className="text-muted-foreground">Advance Payment</p>
                  <p className="font-medium text-foreground">{pi.advance_payment_mode}</p>
                  {pi.advance_payment_notes && <p className="text-xs text-muted-foreground mt-0.5">{pi.advance_payment_notes}</p>}
                </div>
              )}
              {pi.balance_payment_mode && (
                <div>
                  <p className="text-muted-foreground">Balance Payment</p>
                  <p className="font-medium text-foreground">{pi.balance_payment_mode}</p>
                  {pi.balance_payment_notes && <p className="text-xs text-muted-foreground mt-0.5">{pi.balance_payment_notes}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bank Details */}
        {bankLines.length > 0 && (
          <div className="mb-6 p-4 border border-border rounded-lg bg-muted/20">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Payment Details</p>
            <div className="flex flex-col gap-0.5">
              {bankLines.map((line, i) => (
                <p key={i} className="text-sm text-foreground">{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Terms & Conditions */}
        {pi.terms_and_conditions && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Terms & Conditions</p>
            <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
              {pi.terms_and_conditions}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-border/50 flex justify-between items-end">
          <div>
            <p className="text-xs text-muted-foreground">This is a proforma invoice and not a tax invoice.</p>
            <p className="text-xs text-muted-foreground">Generated on {fmtDate(new Date().toISOString())}</p>
          </div>
          <div className="text-right">
            <div className="w-32 border-t border-foreground/30 pt-1 mt-8">
              <p className="text-xs text-muted-foreground">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
