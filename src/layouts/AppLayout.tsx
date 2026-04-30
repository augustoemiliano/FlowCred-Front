import { LayoutDashboard, LogOut, Users, FileText } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

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
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <NavLink to="/" end className={navCls}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </NavLink>
          <NavLink to="/clientes" className={navCls}>
            <Users className="h-4 w-4" />
            Clientes
          </NavLink>
          <NavLink to="/propostas" className={navCls}>
            <FileText className="h-4 w-4" />
            Propostas
          </NavLink>
        </nav>
        <div className="mt-auto space-y-2 p-3">
          <Separator />
          <p className="truncate px-2 text-xs text-muted-foreground">{me?.email}</p>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-border bg-card px-4 md:hidden">
          <span className="font-semibold">FlowCred</span>
        </header>
        <main className="flex-1 bg-background p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
