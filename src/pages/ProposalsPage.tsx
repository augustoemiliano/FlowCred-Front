import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Pagination } from "@/components/Pagination";
import { ProposalFormDialog } from "@/components/ProposalFormDialog";
import { ProposalsTable } from "@/components/ProposalsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { api, apiErrorMessage } from "@/lib/api";
import type { Client, Paginated, ProposalDetail, ProposalStatus, UserMinimal } from "@/types/domain";
import { PROPOSAL_STATUS_OPTIONS } from "@/types/domain";

const PAGE_SIZE = 20;

export function ProposalsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const clientId = searchParams.get("client_id") ?? "";

  const [bank, setBank] = useState("");
  const [debouncedBank, setDebouncedBank] = useState("");
  const [status, setStatus] = useState<ProposalStatus | "">("");
  const [responsible, setResponsible] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedBank(bank.trim()), 350);
    return () => clearTimeout(t);
  }, [bank]);

  useEffect(() => {
    setPage(1);
  }, [debouncedBank, status, responsible, clientId]);

  const params = useMemo(() => {
    const p = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
    if (debouncedBank) p.set("bank", debouncedBank);
    if (status) p.set("status", status);
    if (responsible) p.set("responsible_user_id", responsible);
    if (clientId) p.set("client_id", clientId);
    return p.toString();
  }, [page, debouncedBank, status, responsible, clientId]);

  const list = useQuery({
    queryKey: ["proposals", params],
    queryFn: async () => (await api.get<Paginated<ProposalDetail>>(`/proposals?${params}`)).data,
    placeholderData: keepPreviousData,
  });

  const users = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<UserMinimal[]>("/users")).data,
    staleTime: 5 * 60 * 1000,
  });

  const filteredClient = useQuery({
    queryKey: ["clients", "detail", clientId],
    queryFn: async () => (await api.get<Client>(`/clients/${clientId}`)).data,
    enabled: !!clientId,
  });

  const clearClientFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("client_id");
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propostas</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento das propostas de crédito por etapa</p>
        </div>
        <Button onClick={() => setOpen(true)}>Nova proposta</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Banco, etapa e responsável</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="f-bank">Banco</Label>
              <Input id="f-bank" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Contém…" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="f-status">Etapa</Label>
              <NativeSelect
                id="f-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProposalStatus | "")}
              >
                <option value="">Todas</option>
                {PROPOSAL_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1">
              <Label htmlFor="f-responsible">Responsável</Label>
              <NativeSelect id="f-responsible" value={responsible} onChange={(e) => setResponsible(e.target.value)}>
                <option value="">Todos</option>
                {(users.data ?? []).map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.username}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          {clientId && (
            <p className="text-sm">
              Cliente: <strong>{filteredClient.data?.name ?? `#${clientId}`}</strong>{" "}
              <button type="button" className="text-primary underline" onClick={clearClientFilter}>
                remover filtro
              </button>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {list.error && <p className="text-sm text-red-600">{apiErrorMessage(list.error, "Erro ao carregar propostas.")}</p>}
          <ProposalsTable items={list.data?.items} emptyMessage="Nenhuma proposta encontrada." />
          {list.data && (
            <Pagination page={page} pageSize={PAGE_SIZE} total={list.data.total} onPageChange={setPage} />
          )}
          {!clientId && (
            <p className="text-xs text-muted-foreground">
              Dica: na página de <Link to="/clientes" className="underline">clientes</Link> é possível ver as propostas de
              cada cliente.
            </p>
          )}
        </CardContent>
      </Card>

      <ProposalFormDialog
        open={open}
        onOpenChange={setOpen}
        proposal={null}
        defaultClientId={clientId ? Number(clientId) : undefined}
        onSubmit={async ({ observation: _observation, ...payload }) => {
          const { data } = await api.post<ProposalDetail>("/proposals", payload);
          await qc.invalidateQueries({ queryKey: ["proposals"] });
          await qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
          setOpen(false);
          navigate(`/propostas/${data.id}`);
        }}
      />
    </div>
  );
}
