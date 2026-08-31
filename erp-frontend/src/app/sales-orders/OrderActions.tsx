"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Printer, Eye, Trash2, MoreVertical, AlertCircle, X } from "lucide-react";
import { api } from "@/lib/api";
import { getClientToken } from "@/lib/clientAuth";

type Props = {
  orderId: number;
  status: string;
  totalAmount?: string | null;
  shiprocketOrderId?: number | null;
  onRefresh?: () => void;
  onDelete?: () => void;
};

import ResolutionDialog from "./ResolutionDialog";
import NewSalesOrderForm from "./NewSalesOrderForm";

export default function OrderActions({ orderId, status, totalAmount, shiprocketOrderId, onRefresh, onDelete }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [resolutionType, setResolutionType] = useState<"return" | "replace" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const openMenu = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setMenuOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const refresh = () => { if (onRefresh) { onRefresh(); } else { router.refresh(); } };

  const fulfill = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.post(`/sales-orders/${orderId}/fulfill?created_by=web`, undefined, getClientToken());
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally { setLoading(false); }
  };

  const cancel = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.post(`/sales-orders/${orderId}/cancel`, undefined, getClientToken());
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally { setLoading(false); }
  };

  const moveToDraft = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.post(`/sales-orders/${orderId}/draft`, undefined, getClientToken());
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally { setLoading(false); }
  };

  const remove = async () => {
    if (!window.confirm("Delete this invoice? This cannot be undone.")) return;
    setError(null);
    setLoading(true);
    try {
      await api.delete(`/sales-orders/${orderId}`, getClientToken());
      onDelete?.();
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally { setLoading(false); }
  };

  const handleResolution = async (payload: Record<string, unknown>) => {
    if (!resolutionType) return;
    setError(null);
    setLoading(true);
    try {
      await api.post(`/sales-orders/${orderId}/${resolutionType}?created_by=web`, payload, getClientToken());
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
      throw e;
    } finally { setLoading(false); }
  };

  const returnOrder = async () => {
    setResolutionType("return");
  };

  const replaceOrder = async () => {
    setResolutionType("replace");
  };

  const [fixErrorMode, setFixErrorMode] = useState<boolean>(false);
  const [fixErrorMsg, setFixErrorMsg] = useState<string | null>(null);

  const pushToShiprocket = async () => {
    setError(null);
    setFixErrorMsg(null);
    setLoading(true);
    try {
      await api.post(`/sales-orders/${orderId}/shiprocket`, undefined, getClientToken());
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to push to Shiprocket";
      if (msg.toLowerCase().includes("pincode") || msg.toLowerCase().includes("no lines") || msg.toLowerCase().includes("creation failed")) {
        setFixErrorMsg(msg);
        setFixErrorMode(true);
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  const printInvoice = () => {
    window.open(`/sales-orders/${orderId}/print`, "_blank");
  };

  const previewInvoice = () => {
    window.open(`/sales-orders/${orderId}/print?preview=true`, "_blank");
  };

  return (
    <div className={`flex flex-col items-end gap-2 relative ${menuOpen ? 'z-50' : 'z-10'}`}>
      <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border/40 bg-muted/20">
        {/* Preview */}
        <button
          onClick={previewInvoice}
          title="Preview invoice"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white hover:shadow-sm transition-all cursor-pointer"
        >
          <Eye size={15} />
        </button>

        {/* Print */}
        <button
          onClick={printInvoice}
          title="Print invoice"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white hover:shadow-sm transition-all cursor-pointer"
        >
          <Printer size={15} />
        </button>

        {/* Delete — for cancelled, fulfilled, returned, replaced, AND draft */}
        {(status === "draft" || status === "cancelled" || status === "fulfilled" || status === "returned" || status === "replaced") && (
          <button
            onClick={remove}
            disabled={loading}
            title="Delete invoice"
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-red-50 hover:border-red-100 transition-all cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={15} />
          </button>
        )}

        {/* Status actions menu */}
        {(status === "draft" || status === "fulfilled" || status === "cancelled") && (
          <div>
            <button
              ref={triggerRef}
              onClick={() => menuOpen ? setMenuOpen(false) : openMenu()}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white hover:shadow-sm transition-all cursor-pointer"
            >
              <MoreVertical size={15} />
            </button>
            {menuOpen && typeof document !== "undefined" && createPortal(
              <div
                ref={menuRef}
                style={{ top: menuPos.top, right: menuPos.right }}
                className="fixed w-32 bg-white border border-border rounded-lg shadow-lg z-[9999] overflow-hidden py-1"
              >
                {status === "draft" && (
                  <>
                    <button
                      onClick={() => { fulfill(); setMenuOpen(false); }}
                      disabled={loading}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 text-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      Fulfill
                    </button>
                    <button
                      onClick={() => { cancel(); setMenuOpen(false); }}
                      disabled={loading}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted text-muted-foreground disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {status === "cancelled" && (
                  <button
                    onClick={() => { moveToDraft(); setMenuOpen(false); }}
                    disabled={loading}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-colors"
                  >
                    Move to Draft
                  </button>
                )}
                {status === "fulfilled" && (
                  <>
                    <button
                      onClick={() => { returnOrder(); setMenuOpen(false); }}
                      disabled={loading}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-amber-50 text-amber-700 disabled:opacity-50 transition-colors"
                    >
                      Return
                    </button>
                    <button
                      onClick={() => { replaceOrder(); setMenuOpen(false); }}
                      disabled={loading}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Replace
                    </button>
                  </>
                )}
                {!shiprocketOrderId && (status === "fulfilled" || status === "draft") && (
                  <button
                    onClick={() => { pushToShiprocket(); setMenuOpen(false); }}
                    disabled={loading}
                    className="w-full text-left px-3 py-1.5 text-xs border-t border-border mt-1 pt-1.5 hover:bg-indigo-50 text-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    Shiprocket
                  </button>
                )}
              </div>,
              document.body
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-1.5 p-2 rounded-md bg-red-50 border border-red-100 shadow-sm w-[240px]">
          <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <div className="text-[11px] text-red-600 font-medium leading-tight flex-1 break-words">
            {error}
          </div>
          <button 
            onClick={() => setError(null)} 
            className="text-red-400 hover:text-red-600 p-0.5 rounded-sm hover:bg-red-100 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}
      
      {resolutionType && (
        <ResolutionDialog
          isOpen={!!resolutionType}
          onClose={() => setResolutionType(null)}
          type={resolutionType}
          totalAmount={totalAmount || null}
          onSubmit={handleResolution}
        />
      )}
      
      {fixErrorMode && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-surface rounded-xl shadow-2xl relative">
            {fixErrorMsg && (
              <div className="bg-destructive/10 text-destructive p-4 border-b border-destructive/20 text-sm">
                <strong>Action Required:</strong> {fixErrorMsg}
              </div>
            )}
            <NewSalesOrderForm 
               initialOrderId={orderId} 
               onClose={() => { setFixErrorMode(false); setFixErrorMsg(null); }}
               onSuccess={() => {
                 setFixErrorMode(false);
                 setFixErrorMsg(null);
                 pushToShiprocket();
               }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
