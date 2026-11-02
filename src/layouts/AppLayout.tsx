import { FileText, LayoutDashboard, LogOut, Users } from "lucide-react";
import { Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/clientes", label: "Clientes", icon: Users, end: false },
  { to: "/propostas", label: "Propostas", icon: FileText, end: false },
];

const navCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

export function AppLayout() {
  const { logout, me } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-lg font-semibold tracking-tight">FlowCred</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Navegação principal">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navCls}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2 p-3">
          <Separator />
          <p className="truncate px-2 text-xs text-muted-foreground">{me?.username}</p>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-card md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <span className="font-semibold">FlowCred</span>
            <Button variant="ghost" size="sm" className="gap-2" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-2 pb-2" aria-label="Navegação principal (mobile)">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={navCls}>
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="flex-1 bg-background p-4 md:p-8">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
