"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Boxes, Factory, LayoutGrid, LogOut, Shirt, ClipboardList, BarChart3, Receipt, Users, ScrollText, Scissors, ShoppingCart, FileText, Settings, Bell } from "lucide-react";
import { clearClientToken, getClientToken } from "@/lib/clientAuth";
import { useERP } from "@/lib/useERP";

type NavItem = { href: string; label: string; icon: typeof LayoutGrid };
type NavSection = { title: string | null; items: NavItem[] };

const SECTIONS: NavSection[] = [
  {
    title: null,
    items: [
      { href: "/", label: "Overview", icon: LayoutGrid },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/styles", label: "Styles & Variants", icon: Shirt },
    ],
  },
  {
    title: "Supply",
    items: [
      { href: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
      { href: "/fabric", label: "Fabric Inventory", icon: Boxes },
    ],
  },
  {
    title: "Production",
    items: [
      { href: "/production", label: "Production Orders", icon: Factory },
    ],
  },
  {
    title: "CRM",
    items: [
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/abandoned-carts", label: "Abandoned Carts", icon: ShoppingCart },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/sales-orders", label: "Orders", icon: ScrollText },
      { href: "/proforma-invoices", label: "Proforma Invoices", icon: FileText },
      { href: "/expenses", label: "Expenses", icon: Receipt },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
];

function NavLink({ href, label, icon: Icon, active, badgeCount }: NavItem & { active: boolean, badgeCount?: number }) {
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
}

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: unreadData } = useERP<{count: number}>("/notifications/unread-count", getClientToken() ?? "");
  const unreadCount = unreadData?.count || 0;

  return (
    <aside className="w-64 shrink-0 bg-background min-h-screen px-4 py-6 flex flex-col border-r border-border shadow-sm">
      {/* Brand */}
      <div className="flex items-center gap-3 px-3 pb-8">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0 shadow-sm">
          <Scissors size={18} className="text-white" strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-foreground tracking-tight text-base leading-tight">Silaa</p>
          <p className="text-[11px] text-muted-foreground leading-tight font-medium uppercase tracking-wider">Garment ERP</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-0.5">
        {SECTIONS.map((section, si) => (
          <div key={si} className="flex flex-col gap-0.5">
            {section.title && (
              <p className="px-3 pt-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              <NavLink key={item.href} {...item} active={pathname === item.href} badgeCount={item.href === "/notifications" ? unreadCount : undefined} />
            ))}
          </div>
        ))}

        {role === "admin" && (
          <div className="flex flex-col gap-0.5">
            <p className="px-3 pt-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
              Admin
            </p>
            <NavLink href="/users" label="Users" icon={Users} active={pathname === "/users"} />
            <NavLink href="/settings" label="Settings" icon={Settings} active={pathname.startsWith("/settings")} />
          </div>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-border/50">
        <button
          onClick={() => {
            clearClientToken();
            router.push("/login");
          }}
          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut size={16} strokeWidth={2} className="shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
