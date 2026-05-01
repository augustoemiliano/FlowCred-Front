import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { api, messageFromAxios422 } from "@/lib/api";
import { formatBRL, formatDate } from "@/lib/format";
import type { Client, Proposal, ProposalStatus } from "@/types/domain";
import { PROPOSAL_STATUS_OPTIONS, proposalStatusLabel } from "@/types/domain";
import { useEffect, useMemo, useState } from "react";

const createSchema = z.object({
  client_id: z.coerce.number().int().positive(),
  bank: z.string().min(1),
  property_value: z.coerce.number().positive(),
  financed_amount: z.coerce.number().positive(),
  responsible_user_id: z.coerce.number().int().positive(),
  next_stage_date: z.string().optional(),
  notes: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;

export function ProposalsPage() {
  const qc = useQueryClient();
  const { me } = useAuth();
  const [bank, setBank] = useState("");
  const [status, setStatus] = useState<ProposalStatus | "">("");
  const [responsible, setResponsible] = useState("");
  const [open, setOpen] = useState(false);

  const params = useMemo(() => {
    const p = new URLSearchParams({ page: "1", page_size: "30" });
    if (bank.trim()) p.set("bank", bank.trim());
    if (status) p.set("status", status);
    if (responsible.trim()) p.set("responsible_user_id", responsible.trim());
    return p.toString();
  }, [bank, status, responsible]);

  const list = useQuery({
    queryKey: ["proposals", params],
    queryFn: async () => (await api.get<{ items: Proposal[] }>(`/proposals?${params}`)).data,
  });

  const clients = useQuery({
    queryKey: ["clients-all"],
    queryFn: async () => (await api.get<{ items: Client[] }>("/clients?page=1&page_size=200")).data,
  });

  const hasClients = (clients.data?.items ?? []).length > 0;

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      client_id: 1,
      bank: "",
      property_value: 0,
      financed_amount: 0,
      responsible_user_id: me?.id ?? 1,
      next_stage_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    const first = clients.data?.items?.[0]?.id;
    if (open && first) {
      form.setValue("client_id", first);
    }
  }, [open, clients.data, form]);

  useEffect(() => {
    if (me?.id) {
      form.setValue("responsible_user_id", me.id);
    }
  }, [me, form]);

  const create = useMutation({
    mutationFn: async (v: CreateForm) => {
      await api.post("/proposals", {
        ...v,
        status: "ANALISE_CREDITO",
        next_stage_date: v.next_stage_date?.trim() ? v.next_stage_date : null,
        notes: v.notes?.trim() ? v.notes : null,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["proposals"] });
      setOpen(false);
      form.reset();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propostas</h1>
          <p className="text-sm text-muted-foreground">Filtros e cadastro</p>
        </div>
        <Button
          onClick={() => {
            form.clearErrors("root");
            const firstId = clients.data?.items?.[0]?.id ?? 1;
            form.reset({
              client_id: firstId,
              bank: "",
              property_value: 0,
              financed_amount: 0,
              responsible_user_id: me?.id ?? 1,
              next_stage_date: "",
              notes: "",
            });
            setOpen(true);
          }}
        >
          Nova proposta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros rápidos</CardTitle>
          <CardDescription>Banco, status e responsável</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label>Banco</Label>
            <Input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Contém…" />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProposalStatus | "")}
            >
              <option value="">Todos</option>
              {PROPOSAL_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>ID responsável</Label>
            <Input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="ex: 1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Financiado</TableHead>
                <TableHead>Criada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(list.data?.items ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link className="font-medium text-primary hover:underline" to={`/propostas/${p.id}`}>
                      #{p.id}
                    </Link>
                  </TableCell>
                  <TableCell>{p.bank}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{proposalStatusLabel(String(p.status))}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatBRL(p.financed_amount)}</TableCell>
                  <TableCell>{formatDate(p.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) form.clearErrors("root");
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova proposta</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={form.handleSubmit(async (v) => {
              try {
                await create.mutateAsync(v);
              } catch (e) {
                form.setError("root", { message: messageFromAxios422(e) });
              }
            })}
          >
            {!hasClients && (
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Não há clientes cadastrados.{" "}
                <Link className="font-medium underline" to="/clientes">
                  Ir a Clientes
                </Link>{" "}
                e crie pelo menos um (CPF 11 ou CNPJ 14 dígitos). Com{" "}
                <code className="rounded bg-muted px-1">SEED_DEV_DATA=1</code> o backend cria um cliente demo ao subir.
              </p>
            )}
            <div className="space-y-1">
              <Label>Cliente</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                disabled={!hasClients}
                {...form.register("client_id", { valueAsNumber: true })}
              >
                {(clients.data?.items ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.document}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Banco</Label>
              <Input {...form.register("bank")} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Valor imóvel</Label>
                <Input type="number" step="0.01" {...form.register("property_value", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label>Valor financiado</Label>
                <Input type="number" step="0.01" {...form.register("financed_amount", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Responsável (user id)</Label>
              <Input type="number" {...form.register("responsible_user_id", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1">
              <Label>Próxima etapa (data)</Label>
              <Input type="date" {...form.register("next_stage_date")} />
            </div>
            <div className="space-y-1">
              <Label>Observações</Label>
              <Input {...form.register("notes")} />
            </div>
            {form.formState.errors.root && (
              <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
            )}
            <Button type="submit" disabled={create.isPending || !hasClients}>
              Criar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
