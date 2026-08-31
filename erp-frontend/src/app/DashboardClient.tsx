"use client";

import Link from "next/link";
import { Factory, ShoppingCart, CheckCircle2, Package, ArrowRight, Plus, BarChart2, Globe, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { DashboardSummary } from "@/lib/api";
import { Card } from "@/components/ui";
import { useERP } from "@/lib/useERP";

const EVENT_LABELS: Record<string, { label: string; color: string; shadow: string }> = {
  order_created:      { label: "Order created",      color: "bg-slate-200 text-slate-700", shadow: "ring-1 ring-slate-200" },
  cutting_recorded:   { label: "Cutting recorded",   color: "bg-blue-100 text-blue-700", shadow: "ring-1 ring-blue-200" },
  stitching_sent:     { label: "Sent to stitching",  color: "bg-amber-100 text-amber-700", shadow: "ring-1 ring-amber-200" },
  stitching_received: { label: "Stitching received", color: "bg-amber-200 text-amber-800", shadow: "ring-1 ring-amber-300" },
  qc_applied:         { label: "QC completed",       color: "bg-emerald-100 text-emerald-700", shadow: "ring-1 ring-emerald-200" },
  rework_recorded:    { label: "Rework recorded",    color: "bg-orange-100 text-orange-700", shadow: "ring-1 ring-orange-200" },
  order_closed:       { label: "Order closed",       color: "bg-emerald-200 text-emerald-800", shadow: "ring-1 ring-emerald-300" },
};

function humanEvent(type: string) {
  return EVENT_LABELS[type] ?? { label: type.replace(/_/g, " "), color: "bg-slate-100 text-slate-700", shadow: "ring-1 ring-slate-200" };
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
  { key: "open_production_orders" as const, label: "Open Production", sub: "In progress right now", icon: Factory, iconBg: "bg-slate-100", iconColor: "text-slate-700", href: "/production" },
  { key: "draft_sales_orders" as const, label: "Draft Invoices", sub: "Awaiting fulfillment", icon: ShoppingCart, iconBg: "bg-amber-100", iconColor: "text-amber-700", href: "/sales-orders" },
  { key: "fulfilled_sales_orders" as const, label: "Fulfilled Invoices", sub: "Successfully completed", icon: CheckCircle2, iconBg: "bg-emerald-100", iconColor: "text-emerald-700", href: "/sales-orders" },
  { key: "pending_purchase_orders" as const, label: "Pending POs", sub: "Draft or approved stock", icon: Package, iconBg: "bg-teal-100", iconColor: "text-teal-700", href: "/purchase-orders" },
];

const QUICK_LINKS = [
  { label: "New Invoice", href: "/sales-orders", desc: "Track a sale", icon: ShoppingCart },
  { label: "New Production", href: "/production", desc: "Cut & stitch", icon: Factory },
  { label: "Raise PO", href: "/purchase-orders", desc: "Supplier orders", icon: Package },
  { label: "Log Expense", href: "/expenses", desc: "Salary & costs", icon: Plus },
];

type AnalyticsData = { total_views_30d: number; unique_visitors_30d: number; top_referrers: {referrer: string, count: number}[] };
export default function DashboardClient({ token }: { token: string }) {
  const { data: summary } = useERP<DashboardSummary>("/dashboard/summary", token);
  const s = summary ?? { open_production_orders: 0, draft_sales_orders: 0, fulfilled_sales_orders: 0, pending_purchase_orders: 0, recent_events: [] };
  const { data: analytics } = useERP<AnalyticsData>("/analytics/dashboard", token);
  const recentEvents = s.recent_events ?? [];

  const [greeting, setGreeting] = useState("");
  const [today, setToday] = useState("");
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    // eslint-disable-next-line
    setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
    // eslint-disable-next-line
    setToday(now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-8 py-10 space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">{today}</p>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{greeting}</h1>
        <div className="mt-3 h-px bg-gradient-to-r from-accent/40 via-accent/10 to-transparent" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {STATS.map(({ key, label, sub, icon: Icon, iconBg, iconColor, href }) => (
          <Link key={key} href={href} className="group">
            <Card className="relative overflow-hidden p-6 h-full flex flex-col justify-between">
              <div className="flex items-start justify-between mb-4">
                <div className={`inline-flex p-3 rounded-2xl ${iconBg} shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
                  <Icon size={20} className={iconColor} strokeWidth={2.5} />
                </div>
              </div>
              <div>
                <div className="text-4xl font-black tracking-tighter text-foreground mb-2 tabular-nums">{s[key]}</div>
                <div className="text-sm font-bold text-foreground/90">{label}</div>
                <div className="text-xs font-medium text-muted-foreground/70 mt-1">{sub}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-border md:col-span-3 p-6 flex flex-col md:flex-row items-center gap-8 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 justify-center md:justify-start">
              <Globe className="text-accent" size={24} /> 
              Storefront Traffic (30 Days)
            </h2>
            <p className="text-sm text-muted-foreground">Real-time visitor analytics from your website.</p>
          </div>
          <div className="flex-1 flex gap-6 w-full justify-around md:justify-end">
            <div className="text-center">
              <div className="text-4xl font-black text-foreground">{analytics?.total_views_30d || 0}</div>
              <div className="text-sm font-bold text-muted-foreground flex items-center gap-1 justify-center"><BarChart2 size={14} /> Page Views</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-foreground">{analytics?.unique_visitors_30d || 0}</div>
              <div className="text-sm font-bold text-muted-foreground flex items-center gap-1 justify-center"><Users size={14} /> Unique Visitors</div>
            </div>
          </div>
          {analytics?.top_referrers && analytics.top_referrers.length > 0 && (
            <div className="flex-1 w-full border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-8">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-3 text-center md:text-left">Top Sources</h3>
              <div className="space-y-2">
                {analytics.top_referrers.map((r, i) => (
                  <div key={i} className="flex justify-between items-center text-sm font-medium">
                    <span className="truncate max-w-[120px] text-foreground/80">{r.referrer.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]}</span>
                    <span className="text-accent">{r.count} views</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 shadow-sm border-border">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 bg-slate-50/50">
            <h2 className="text-base font-semibold text-foreground tracking-tight">Recent activity</h2>
            <Link href="/production" className="text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1 transition-colors group">
              View all <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-8 text-center">No recent activity found.</p>
          ) : (
            <div className="px-6 py-4">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/60 before:to-transparent">
                {recentEvents.map((e, i) => {
                  const { label, color, shadow } = humanEvent(e.event_type);
                  return (
                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full border-4 border-white ${color} ${shadow} shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ml-0 mr-4 md:mx-0 shadow-sm transition-transform duration-300 group-hover:scale-110`} />
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-white/50 border border-border/40 p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-foreground/90">{label}</span>
                          <span className="tnum text-xs font-medium text-muted-foreground/60">{relativeTime(e.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Order</span>
                          <Link href="/production" className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-muted text-accent text-xs font-mono font-medium hover:bg-accent/10 transition-colors">
                            #{e.production_order_id}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        <Card className="shadow-sm border-border flex flex-col">
          <div className="px-6 py-5 border-b border-border/40 bg-slate-50/50">
            <h2 className="text-base font-semibold text-foreground tracking-tight">Quick Actions</h2>
          </div>
          <div className="p-4 flex-1 grid grid-cols-2 gap-3">
            {QUICK_LINKS.map(({ label, href, desc, icon: Icon }) => (
              <Link key={href + label} href={href} className="flex flex-col items-center justify-center gap-3 rounded-2xl p-5 bg-white border border-border/50 hover:border-accent/30 hover:bg-accent/5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] transition-all duration-300 group text-center hover:-translate-y-0.5">
                <div className="p-3 rounded-xl bg-muted group-hover:bg-accent group-hover:text-white transition-colors duration-300 shadow-sm text-muted-foreground">
                  <Icon size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground group-hover:text-accent transition-colors duration-300">{label}</div>
                  <div className="text-[11px] font-medium leading-tight text-muted-foreground/70 mt-1 px-1">{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
