with open("erp-frontend/src/app/DashboardClient.tsx", "r") as f:
    content = f.read()

# Add new imports
if 'import { BarChart2, Globe, Users } from "lucide-react";' not in content:
    content = content.replace('import { Factory, ShoppingCart, CheckCircle2, Package, ArrowRight, Plus } from "lucide-react";',
        'import { Factory, ShoppingCart, CheckCircle2, Package, ArrowRight, Plus, BarChart2, Globe, Users } from "lucide-react";')

if 'type AnalyticsData =' not in content:
    content = content.replace('export default function DashboardClient({ token }: { token: string }) {',
        """type AnalyticsData = { total_views_30d: number; unique_visitors_30d: number; top_referrers: {referrer: string, count: number}[] };
export default function DashboardClient({ token }: { token: string }) {""")

if 'const { data: analytics } = useERP<AnalyticsData>("/analytics/dashboard"' not in content:
    content = content.replace('  const s = summary ?? { open_production_orders: 0, draft_sales_orders: 0, fulfilled_sales_orders: 0, pending_purchase_orders: 0, recent_events: [] };',
        '  const s = summary ?? { open_production_orders: 0, draft_sales_orders: 0, fulfilled_sales_orders: 0, pending_purchase_orders: 0, recent_events: [] };\n  const { data: analytics } = useERP<AnalyticsData>("/analytics/dashboard", token);')

analytics_card = """
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
"""

if "Storefront Traffic" not in content:
    content = content.replace('      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">',
        analytics_card + '\n      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">')

with open("erp-frontend/src/app/DashboardClient.tsx", "w") as f:
    f.write(content)

