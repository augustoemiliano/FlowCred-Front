import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, Pencil, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ProposalFormDialog } from "@/components/ProposalFormDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, apiErrorMessage } from "@/lib/api";
import { formatBRL, formatBytes, formatDate, formatDateOnly, formatDocument } from "@/lib/format";
import type { ChecklistItem, DocumentMeta, HistoryEntry, ProposalDetail, ProposalStatus } from "@/types/domain";
import { historyActionLabel, PROPOSAL_STATUS_OPTIONS, proposalStatusLabel } from "@/types/domain";

export function ProposalDetailPage() {
  const { id } = useParams();
  const proposalId = Number(id);
  const validId = Number.isInteger(proposalId) && proposalId > 0;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [status, setStatus] = useState<ProposalStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const detail = useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: async () => (await api.get<ProposalDetail>(`/proposals/${proposalId}`)).data,
    enabled: validId,
  });

  const checklist = useQuery({
    queryKey: ["checklist", proposalId],
    queryFn: async () => (await api.get<ChecklistItem[]>(`/proposals/${proposalId}/checklist`)).data,
    enabled: validId,
  });

  const history = useQuery({
    queryKey: ["history", proposalId],
    queryFn: async () => (await api.get<HistoryEntry[]>(`/proposals/${proposalId}/history`)).data,
    enabled: validId,
  });

  const documents = useQuery({
    queryKey: ["documents", proposalId],
    queryFn: async () => (await api.get<DocumentMeta[]>(`/proposals/${proposalId}/documents`)).data,
    enabled: validId,
  });

  const refreshProposal = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["proposal", proposalId] }),
      qc.invalidateQueries({ queryKey: ["history", proposalId] }),
      qc.invalidateQueries({ queryKey: ["proposals"] }),
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] }),
    ]);
  };

  const onError = (fallback: string) => (e: unknown) => setError(apiErrorMessage(e, fallback));

  const patchStatus = useMutation({
    mutationFn: async () => {
      await api.patch(`/proposals/${proposalId}/status`, { status, note: statusNote.trim() || null });
    },
    onSuccess: async () => {
      setError(null);
      setStatus("");
      setStatusNote("");
      await refreshProposal();
    },
    onError: onError("Não foi possível alterar a etapa."),
  });

  const toggleItem = useMutation({
    mutationFn: async (payload: { id: number; is_done: boolean }) => {
      await api.patch(`/checklist/${payload.id}`, { is_done: payload.is_done });
    },
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["checklist", proposalId] });
      await qc.invalidateQueries({ queryKey: ["history", proposalId] });
    },
    onError: onError("Não foi possível atualizar o checklist."),
  });

  const upload = useMutation({
    mutationFn: async (f: File) => {
      const fd = new FormData();
      fd.append("file", f);
      await api.post(`/proposals/${proposalId}/documents`, fd);
    },
    onSuccess: async () => {
      setError(null);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      await qc.invalidateQueries({ queryKey: ["documents", proposalId] });
      await qc.invalidateQueries({ queryKey: ["history", proposalId] });
    },
    onError: onError("Falha no envio do documento."),
  });

  const removeDocument = useMutation({
    mutationFn: async (docId: number) => {
      await api.delete(`/documents/${docId}`);
    },
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["documents", proposalId] });
      await qc.invalidateQueries({ queryKey: ["history", proposalId] });
    },
    onError: onError("Não foi possível excluir o documento."),
  });

  const removeProposal = useMutation({
    mutationFn: async () => {
      await api.delete(`/proposals/${proposalId}`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["proposals"] });
      await qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
      navigate("/propostas", { replace: true });
    },
    onError: onError("Não foi possível excluir a proposta."),
  });

  const download = async (docId: number, name: string) => {
    try {
      const res = await api.get<Blob>(`/documents/${docId}/download`, { responseType: "blob" });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(apiErrorMessage(e, "Não foi possível baixar o documento."));
    }
  };

  if (!validId) {
    return <p className="text-sm text-muted-foreground">ID inválido.</p>;
  }

  if (detail.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (detail.error || !detail.data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">Proposta não encontrada.</p>
        <Link to="/propostas" className="text-sm text-primary underline">
          Voltar para propostas
        </Link>
      </div>
    );
  }

  const p = detail.data;
  const doneCount = (checklist.data ?? []).filter((i) => i.is_done).length;
  const totalCount = checklist.data?.length ?? 0;

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
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <StatusBadge status={String(p.status)} />
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3 w-3" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-red-600"
            disabled={removeProposal.isPending}
            onClick={() => {
              if (window.confirm(`Excluir a proposta #${p.id}? Checklist, histórico e documentos serão apagados.`)) {
                removeProposal.mutate();
              }
            }}
          >
            <Trash2 className="h-3 w-3" />
            Excluir
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>Dados principais</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Info label="Valor do imóvel" value={formatBRL(p.property_value)} />
            <Info label="Valor financiado" value={formatBRL(p.financed_amount)} />
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="font-medium">{p.client.name}</p>
              <p className="text-xs text-muted-foreground">{formatDocument(p.client.document)}</p>
            </div>
            <Info label="Responsável" value={p.responsible.username} />
            <Info label="Próxima etapa" value={formatDateOnly(p.next_stage_date)} />
            <Info label="Criada em" value={formatDate(p.created_at)} />
            {p.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Observações</p>
                <p className="whitespace-pre-line text-sm">{p.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mover etapa</CardTitle>
            <CardDescription>Registrada automaticamente no histórico</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="new-status">Nova etapa</Label>
              <NativeSelect
                id="new-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProposalStatus)}
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {PROPOSAL_STATUS_OPTIONS.filter((o) => o.value !== p.status).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1">
              <Label htmlFor="status-note">Observação (opcional)</Label>
              <Input id="status-note" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
            </div>
            <Button disabled={!status || patchStatus.isPending} onClick={() => patchStatus.mutate()}>
              {patchStatus.isPending ? "Atualizando…" : "Atualizar etapa"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
            <CardDescription>
              {totalCount ? `${doneCount} de ${totalCount} itens concluídos` : "Itens da operação"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(checklist.data ?? []).map((item) => (
              <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3">
                <Checkbox
                  checked={item.is_done}
                  disabled={toggleItem.isPending}
                  onCheckedChange={(v) => toggleItem.mutate({ id: item.id, is_done: v === true })}
                />
                <span className={item.is_done ? "text-sm leading-snug text-muted-foreground line-through" : "text-sm leading-snug"}>
                  {item.title}
                </span>
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
              <Input
                ref={fileInput}
                type="file"
                aria-label="Selecionar documento"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <Button disabled={!file || upload.isPending} onClick={() => file && upload.mutate(file)} className="gap-2">
                <Upload className="h-4 w-4" />
                {upload.isPending ? "Enviando…" : "Enviar"}
              </Button>
            </div>
            <Separator />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Enviado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(documents.data ?? []).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="max-w-[200px] truncate" title={d.display_name}>
                        {d.display_name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatBytes(d.size_bytes)}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(d.created_at)}</TableCell>
                      <TableCell className="space-x-1 whitespace-nowrap text-right">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => download(d.id, d.display_name)}>
                          <Download className="h-3 w-3" />
                          Baixar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Excluir ${d.display_name}`}
                          className="text-red-600"
                          disabled={removeDocument.isPending}
                          onClick={() => {
                            if (window.confirm(`Excluir o documento "${d.display_name}"?`)) removeDocument.mutate(d.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {documents.data && documents.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        Nenhum documento anexado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>Linha do tempo das movimentações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(history.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sem eventos.</p>}
          <ol className="relative space-y-4 pl-4 before:absolute before:left-1 before:top-2 before:h-[calc(100%-8px)] before:w-px before:bg-border">
            {(history.data ?? []).map((h) => (
              <li key={h.id} className="relative rounded-md border border-border bg-card p-3">
                <div className="absolute -left-[9px] top-4 h-2 w-2 rounded-full bg-primary" />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{historyActionLabel(h.action)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(h.created_at)}</p>
                </div>
                <p className="text-xs text-muted-foreground">{h.user_username ?? `usuário #${h.user_id}`}</p>
                {h.action === "STATUS_CHANGED" && (
                  <p className="mt-1 text-xs">
                    {h.old_status ? proposalStatusLabel(h.old_status) : "—"} →{" "}
                    {h.new_status ? proposalStatusLabel(h.new_status) : "—"}
                  </p>
                )}
                {h.action === "CREATED" && h.new_status && (
                  <p className="mt-1 text-xs">Etapa inicial: {proposalStatusLabel(h.new_status)}</p>
                )}
                {h.note && <p className="mt-2 whitespace-pre-line text-sm">{h.note}</p>}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <ProposalFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        proposal={p}
        onSubmit={async (payload) => {
          await api.put(`/proposals/${p.id}`, payload);
          await refreshProposal();
          setEditOpen(false);
        }}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
