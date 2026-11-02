import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RequireAuth } from "@/routes/RequireAuth";

// Code splitting por página: o dashboard (Recharts) só é carregado quando necessário.
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ClientsPage = lazy(() => import("@/pages/ClientsPage").then((m) => ({ default: m.ClientsPage })));
const ProposalsPage = lazy(() => import("@/pages/ProposalsPage").then((m) => ({ default: m.ProposalsPage })));
const ProposalDetailPage = lazy(() =>
  import("@/pages/ProposalDetailPage").then((m) => ({ default: m.ProposalDetailPage })),
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="clientes" element={<ClientsPage />} />
              <Route path="propostas" element={<ProposalsPage />} />
              <Route path="propostas/:id" element={<ProposalDetailPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
