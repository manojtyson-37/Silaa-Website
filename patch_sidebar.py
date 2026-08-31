import re

with open("erp-frontend/src/components/Sidebar.tsx", "r") as f:
    content = f.read()

content = content.replace(
    'import { Boxes, Factory, LayoutGrid, LogOut, Shirt, ClipboardList, BarChart3, Receipt, Users, ScrollText, Scissors, ShoppingCart, FileText, Settings } from "lucide-react";',
    'import { Boxes, Factory, LayoutGrid, LogOut, Shirt, ClipboardList, BarChart3, Receipt, Users, ScrollText, Scissors, ShoppingCart, FileText, Settings, Bell } from "lucide-react";'
)

if 'import { useERP }' not in content:
    content = content.replace('import { clearClientToken } from "@/lib/clientAuth";', 
        'import { clearClientToken, getClientToken } from "@/lib/clientAuth";\nimport { useERP } from "@/lib/useERP";')

if 'const { data: unreadData } = useERP<{count: number}>("/notifications/unread-count", getClientToken(), { refreshInterval: 30000 });' not in content:
    content = content.replace(
        '  const router = useRouter();',
        '  const router = useRouter();\n  const { data: unreadData } = useERP<{count: number}>("/notifications/unread-count", getClientToken(), { refreshInterval: 30000 });\n  const unreadCount = unreadData?.count || 0;'
    )

content = content.replace(
    '    items: [{ href: "/", label: "Overview", icon: LayoutGrid }],',
    '    items: [\n      { href: "/", label: "Overview", icon: LayoutGrid },\n      { href: "/notifications", label: "Notifications", icon: Bell },\n    ],'
)

nav_link_old = """function NavLink({ href, label, icon: Icon, active }: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-accent/10 text-accent"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon size={16} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
      {label}
    </Link>
  );
}"""

nav_link_new = """function NavLink({ href, label, icon: Icon, active, badgeCount }: NavItem & { active: boolean, badgeCount?: number }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-accent/10 text-accent"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon size={16} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
        {label}
      </div>
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {badgeCount}
        </span>
      )}
    </Link>
  );
}"""
content = content.replace(nav_link_old, nav_link_new)

# Now we need to pass badgeCount in the mapping
content = content.replace(
    '<NavLink key={item.href} {...item} active={pathname === item.href} />',
    '<NavLink key={item.href} {...item} active={pathname === item.href} badgeCount={item.href === "/notifications" ? unreadCount : undefined} />'
)

with open("erp-frontend/src/components/Sidebar.tsx", "w") as f:
    f.write(content)

