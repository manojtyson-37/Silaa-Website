import Link from "next/link";
import { Factory, ShoppingCart, CheckCircle2, Package, ArrowRight, Plus } from "lucide-react";
import { api, DashboardSummary } from "@/lib/api";
import { Card } from "@/components/ui";
import { requireAuth } from "@/lib/serverAuth";

const EVENT_LABELS: Record<string, { label: string; color: string; shadow: string }> = {
  order_created:      { label: "Order created",      color: "bg-slate-400", shadow: "shadow-[0_0_8px_rgba(148,163,184,0.6)]" },
  cutting_recorded:   { label: "Cutting recorded",   color: "bg-blue-500", shadow: "shadow-[0_0_8px_rgba(59,130,246,0.6)]" },
  stitching_sent:     { label: "Sent to stitching",  color: "bg-amber-400", shadow: "shadow-[0_0_8px_rgba(251,191,36,0.6)]" },
  stitching_received: { label: "Stitching received", color: "bg-amber-500", shadow: "shadow-[0_0_8px_rgba(245,158,11,0.6)]" },
  qc_applied:         { label: "QC completed",       color: "bg-emerald-500", shadow: "shadow-[0_0_8px_rgba(16,185,129,0.6)]" },
  rework_recorded:    { label: "Rework recorded",    color: "bg-orange-500", shadow: "shadow-[0_0_8px_rgba(249,115,22,0.6)]" },
  order_closed:       { label: "Order closed",       color: "bg-emerald-600", shadow: "shadow-[0_0_8px_rgba(5,150,105,0.6)]" },
};

function humanEvent(type: string) {
  return EVENT_LABELS[type] ?? { label: type.replace(/_/g, " "), color: "bg-slate-400", shadow: "shadow-none" };
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const STATS = [
  {
    key: "open_production_orders" as const,
    label: "Open Production",
    sub: "In progress right now",
    icon: Factory,
    gradient: "from-slate-50 to-white",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-700",
    href: "/production",
  },
  {
    key: "draft_sales_orders" as const,
    label: "Draft Invoices",
    sub: "Awaiting fulfillment",
    icon: ShoppingCart,
    gradient: "from-amber-50/50 to-white",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    href: "/sales-orders",
  },
  {
    key: "fulfilled_sales_orders" as const,
    label: "Fulfilled Invoices",
    sub: "Successfully completed",
    icon: CheckCircle2,
    gradient: "from-emerald-50/50 to-white",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    href: "/sales-orders",
  },
  {
    key: "pending_purchase_orders" as const,
    label: "Pending POs",
    sub: "Draft or approved stock",
    icon: Package,
    gradient: "from-teal-50/50 to-white",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-700",
    href: "/purchase-orders",
  },
];

const QUICK_LINKS = [
  { label: "New Invoice",          href: "/sales-orders",     desc: "Track a sale", icon: ShoppingCart },
  { label: "New Production", href: "/production",       desc: "Cut & stitch", icon: Factory },
  { label: "Raise PO",   href: "/purchase-orders",  desc: "Supplier orders", icon: Package },
  { label: "Log Expense",          href: "/expenses",         desc: "Salary & costs", icon: Plus },
];

export default async function Home() {
  const token = await requireAuth();
  const summary = await api.get<DashboardSummary>("/dashboard/summary", token);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = now.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <main className="max-w-6xl mx-auto px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{greeting}, Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">{today}</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {STATS.map(({ key, label, sub, icon: Icon, gradient, iconBg, iconColor, href }) => (
          <Link key={key} href={href} className="group">
            <Card className={`relative overflow-hidden bg-gradient-to-br ${gradient} p-5 border border-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-full ${iconBg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={18} className={iconColor} strokeWidth={2} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold tracking-tighter text-foreground mb-1">
                  {summary[key]}
                </div>
                <div className="text-sm font-semibold text-foreground/90">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* 2-col body */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent activity — 2/3 */}
        <Card className="xl:col-span-2 shadow-sm border-border">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 bg-slate-50/50">
            <h2 className="text-base font-semibold text-foreground tracking-tight">Recent activity</h2>
            <Link href="/production" className="text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1 transition-colors group">
              View all <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {summary.recent_events.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-8 text-center">No recent activity found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-muted-foreground border-b border-border/40 bg-slate-50/30">
                    <th className="px-6 py-3">Event Details</th>
                    <th className="px-4 py-3">Order Ref</th>
                    <th className="px-6 py-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {summary.recent_events.map((e, i) => {
                    const { label, color, shadow } = humanEvent(e.event_type);
                    return (
                      <tr key={i} className="group hover:bg-slate-50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color} ${shadow}`} />
                            <span className="font-medium text-foreground/90">{label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Link href="/production" className="inline-flex items-center justify-center px-2 py-1 rounded bg-slate-100 text-accent text-xs font-mono font-medium hover:bg-slate-200 transition-colors">
                            #{e.production_order_id}
                          </Link>
                        </td>
                        <td className="tnum px-6 py-4 text-right text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">
                          {relativeTime(e.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Quick links — 1/3 */}
        <Card className="shadow-sm border-border flex flex-col">
          <div className="px-6 py-5 border-b border-border/40 bg-slate-50/50">
            <h2 className="text-base font-semibold text-foreground tracking-tight">Quick Actions</h2>
          </div>
          <div className="p-4 flex-1 grid grid-cols-2 gap-3">
            {QUICK_LINKS.map(({ label, href, desc, icon: Icon }) => (
              <Link
                key={href + label}
                href={href}
                className="flex flex-col items-center justify-center gap-2 rounded-xl p-4 border border-transparent hover:border-border/60 bg-transparent hover:bg-slate-50/80 hover:shadow-sm transition-all duration-200 group text-center"
              >
                <div className="p-2.5 rounded-full bg-slate-100 text-muted-foreground group-hover:bg-white group-hover:text-accent transition-colors shadow-sm">
                  <Icon size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">{label}</div>
                  <div className="text-[10px] leading-tight text-muted-foreground mt-0.5 px-1">{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
