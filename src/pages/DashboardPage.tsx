import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ProposalsTable } from "@/components/ProposalsTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatBRL } from "@/lib/format";
import type { DashboardSummary, Paginated, ProposalDetail } from "@/types/domain";
import { PROPOSAL_STATUS_OPTIONS } from "@/types/domain";
import { Link } from "react-router-dom";

export function DashboardPage() {
  const summary = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await api.get<DashboardSummary>("/dashboard/summary")).data,
  });

  const recent = useQuery({
    queryKey: ["proposals", "recent"],
    queryFn: async () => (await api.get<Paginated<ProposalDetail>>("/proposals?page=1&page_size=8")).data,
  });

  const chartData =
    summary.data &&
    // Todas as etapas, na ordem do fluxo (inclui as que têm 0 propostas).
    PROPOSAL_STATUS_OPTIONS.map((o) => ({ status: o.label, count: summary.data.proposals_by_status[o.value] ?? 0 }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão operacional das propostas</p>
      </div>

      {summary.isLoading && <p className="text-sm text-muted-foreground">Carregando indicadores…</p>}
      {summary.error && <p className="text-sm text-red-600">Não foi possível carregar o dashboard.</p>}

      {summary.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de propostas</CardDescription>
                <CardTitle className="text-3xl">{summary.data.total_proposals}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Em análise de crédito</CardDescription>
                <CardTitle className="text-3xl">{summary.data.proposals_em_analise}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>No jurídico</CardDescription>
                <CardTitle className="text-3xl">{summary.data.proposals_juridico}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Finalizadas</CardDescription>
                <CardTitle className="text-3xl">{summary.data.proposals_finalizadas}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Propostas por status</CardTitle>
                <CardDescription>Distribuição atual</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData ?? []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={70} />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [v, "Qtd"]} />
                    <Bar dataKey="count" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financiado</CardTitle>
                <CardDescription>Soma do valor financiado</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{formatBRL(summary.data.total_financed_amount)}</p>
                <p className="mt-4 text-sm text-muted-foreground">Principais bancos</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {Object.entries(summary.data.proposals_by_bank)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([bank, count]) => (
                      <li key={bank} className="flex justify-between gap-2">
                        <span className="truncate">{bank}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Últimas propostas</CardTitle>
            <CardDescription>Atalho para acompanhamento</CardDescription>
          </div>
          <Link to="/propostas" className="text-sm font-medium text-primary hover:underline">
            Ver todas
          </Link>
        </CardHeader>
        <CardContent>
          <ProposalsTable items={recent.data?.items} emptyMessage="Nenhuma proposta ainda." />
        </CardContent>
      </Card>
    </div>
  );
}
