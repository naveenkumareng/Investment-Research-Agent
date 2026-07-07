import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Search,
  BarChart3,
  Wallet,
  Star,
  Filter,
  Newspaper,
  Sparkles,
  Bell,
  FileText,
  Settings,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useNavigate } from "@tanstack/react-router";

const sections: Array<{
  label: string;
  items: Array<{ to: string; label: string; icon: React.ComponentType<{ className?: string }> }>;
}> = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/stocks", label: "Stocks", icon: Search },
      { to: "/screener", label: "Screener", icon: Filter },
    ],
  },
  {
    label: "Personal",
    items: [
      { to: "/portfolio", label: "Portfolio", icon: Wallet },
      { to: "/watchlist", label: "Watchlist", icon: Star },
      { to: "/alerts", label: "Alerts", icon: Bell },
    ],
  },
  {
    label: "Research",
    items: [
      { to: "/ai", label: "AI Research", icon: Sparkles },
      { to: "/news", label: "News", icon: Newspaper },
      { to: "/reports", label: "Reports", icon: FileText },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden fixed left-0 top-0 h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4 flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <TrendingUp className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">Investa</div>
          <div className="-mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            Research Terminal
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.to ||
                  (item.to !== "/dashboard" && pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-sidebar-primary/15 text-sidebar-primary"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3 flex-shrink-0">
        <Link
          to="/settings"
          className="mb-1 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
        >
          <Settings className="h-4 w-4" /> Settings
        </Link>
        <div className="mt-2 flex items-center gap-2 rounded-md bg-sidebar-accent/40 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold uppercase text-primary">
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold">{user?.name ?? "Guest"}</div>
            <div className="truncate text-[10px] text-muted-foreground">{user?.email}</div>
          </div>
          <button
            aria-label="Sign out"
            onClick={() => {
              logout();
              navigate({ to: "/auth" });
            }}
            className="rounded p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-bear"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
