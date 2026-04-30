import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

export function RequireAuth() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando…</div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
