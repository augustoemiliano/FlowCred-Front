import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Upload } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatBRL, formatDate } from "@/lib/format";
import type { ChecklistItem, DocumentMeta, HistoryEntry, ProposalDetail, ProposalStatus } from "@/types/domain";
import { PROPOSAL_STATUS_OPTIONS, proposalStatusLabel } from "@/types/domain";

export function ProposalDetailPage() {
  const { id } = useParams();
  const proposalId = Number(id);
  const qc = useQueryClient();
  const [status, setStatus] = useState<ProposalStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const detail = useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: async () => (await api.get<ProposalDetail>(`/proposals/${proposalId}`)).data,
    enabled: Number.isFinite(proposalId),
  });

  const checklist = useQuery({
    queryKey: ["checklist", proposalId],
    queryFn: async () => (await api.get<ChecklistItem[]>(`/proposals/${proposalId}/checklist`)).data,
    enabled: Number.isFinite(proposalId),
  });

  const history = useQuery({
    queryKey: ["history", proposalId],
    queryFn: async () => (await api.get<HistoryEntry[]>(`/proposals/${proposalId}/history`)).data,
    enabled: Number.isFinite(proposalId),
  });

  const documents = useQuery({
    queryKey: ["documents", proposalId],
    queryFn: async () => (await api.get<DocumentMeta[]>(`/proposals/${proposalId}/documents`)).data,
    enabled: Number.isFinite(proposalId),
  });

  const patchStatus = useMutation({
    mutationFn: async () => {
      if (!status) return;
      await api.patch(`/proposals/${proposalId}/status`, { status, note: statusNote.trim() || null });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["proposal", proposalId] });
      await qc.invalidateQueries({ queryKey: ["history", proposalId] });
      setStatusNote("");
    },
  });

  const toggleItem = useMutation({
    mutationFn: async (payload: { id: number; is_done: boolean }) => {
      await api.patch(`/checklist/${payload.id}`, { is_done: payload.is_done });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["checklist", proposalId] });
    },
  });

  const upload = useMutation({
    mutationFn: async (f: File) => {
      const fd = new FormData();
      fd.append("file", f);
      await api.post(`/proposals/${proposalId}/documents`, fd);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["documents", proposalId] });
      setFile(null);
    },
  });

  const download = async (docId: number, name: string) => {
    const res = await api.get<Blob>(`/documents/${docId}/download`, { responseType: "blob" });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!Number.isFinite(proposalId)) {
    return <p className="text-sm text-muted-foreground">ID inválido.</p>;
  }

  if (detail.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (detail.error || !detail.data) {
    return <p className="text-sm text-red-600">Proposta não encontrada.</p>;
  }

  const p = detail.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to="/propostas" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">Proposta #{p.id}</h1>
          <p className="text-sm text-muted-foreground">
            {p.client.name} · {p.bank}
          </p>
        </div>
        <Badge className="ml-auto" variant="secondary">
          {proposalStatusLabel(String(p.status))}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>Dados principais</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Valor imóvel</p>
              <p className="font-medium">{formatBRL(p.property_value)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor financiado</p>
              <p className="font-medium">{formatBRL(p.financed_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="font-medium">{p.client.name}</p>
              <p className="text-xs text-muted-foreground">{p.client.document}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Responsável</p>
              <p className="font-medium">{p.responsible.username}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Próxima etapa</p>
              <p className="font-medium">{p.next_stage_date ?? "—"}</p>
            </div>
            {p.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Observações</p>
                <p className="text-sm">{p.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alterar status</CardTitle>
            <CardDescription>Registra no histórico automaticamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Novo status</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProposalStatus)}
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {PROPOSAL_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Observação (opcional)</Label>
              <Input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
            </div>
            <Button disabled={!status || patchStatus.isPending} onClick={() => patchStatus.mutate()}>
              Atualizar status
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Histórico de movimentações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(history.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sem eventos.</p>}
          <div className="relative space-y-4 pl-4 before:absolute before:left-1 before:top-2 before:h-[calc(100%-8px)] before:w-px before:bg-border">
            {(history.data ?? []).map((h) => (
              <div key={h.id} className="relative rounded-md border border-border bg-card p-3">
                <div className="absolute -left-[9px] top-4 h-2 w-2 rounded-full bg-primary" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{h.action}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(h.created_at)}</p>
                </div>
                <p className="text-xs text-muted-foreground">{h.user_username ?? `user #${h.user_id}`}</p>
                {(h.old_status || h.new_status) && (
                  <p className="mt-1 text-xs">
                    {h.old_status ? proposalStatusLabel(h.old_status) : "—"} →{" "}
                    {h.new_status ? proposalStatusLabel(h.new_status) : "—"}
                  </p>
                )}
                {h.note && <p className="mt-2 text-sm">{h.note}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
            <CardDescription>Itens da operação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(checklist.data ?? []).map((item) => (
              <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
                <Checkbox
                  checked={item.is_done}
                  onCheckedChange={(v) => toggleItem.mutate({ id: item.id, is_done: v === true })}
                />
                <span className="text-sm leading-snug">{item.title}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
            <CardDescription>PDF, PNG ou JPEG (limite configurado no backend)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-2">
              <Input type="file" accept=".pdf,.png,.jpg,.jpeg,image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <Button
                disabled={!file || upload.isPending}
                onClick={() => file && upload.mutate(file)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Enviar
              </Button>
            </div>
            <Separator />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(documents.data ?? []).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="max-w-[200px] truncate">{d.display_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.mime_type}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => download(d.id, d.display_name)}>
                        <Download className="h-3 w-3" />
                        Baixar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
