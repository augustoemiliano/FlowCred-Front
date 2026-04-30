import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { api } from "@/lib/api";
import { formatBRL, formatDate } from "@/lib/format";
import type { Client } from "@/types/domain";

const clientSchema = z.object({
  name: z.string().min(1),
  document: z.string().min(1),
  phone: z.string().min(8),
  email: z.string().email(),
  monthly_income: z.string().optional().transform((s) => (s?.trim() ? s : undefined)),
  notes: z.string().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

export function ClientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const list = useQuery({
    queryKey: ["clients", debounced],
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", page_size: "50" });
      if (debounced) params.set("search", debounced);
      return (await api.get<{ items: Client[] }>(`/clients?${params}`)).data;
    },
  });

  const form = useForm<ClientForm>({ resolver: zodResolver(clientSchema) });

  useEffect(() => {
    if (editing) {
      form.reset({
        name: editing.name,
        document: editing.document,
        phone: editing.phone,
        email: editing.email,
        monthly_income: editing.monthly_income ?? "",
        notes: editing.notes ?? "",
      });
    } else {
      form.reset({ name: "", document: "", phone: "", email: "", monthly_income: "", notes: "" });
    }
  }, [editing, form, open]);

  const save = useMutation({
    mutationFn: async (values: ClientForm) => {
      const payload = {
        name: values.name,
        document: values.document,
        phone: values.phone,
        email: values.email,
        notes: values.notes?.trim() ? values.notes : null,
        monthly_income: values.monthly_income?.trim()
          ? Number(String(values.monthly_income).replace(",", "."))
          : null,
      };
      if (editing) {
        await api.put(`/clients/${editing.id}`, payload);
      } else {
        await api.post("/clients", payload);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["clients"] });
      setOpen(false);
      setEditing(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Cadastro e busca rápida</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setEditing(null);
          }}
        >
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            Novo cliente
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={form.handleSubmit(async (v) => {
                await save.mutateAsync(v);
              })}
            >
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input {...form.register("name")} />
              </div>
              <div className="space-y-1">
                <Label>CPF/CNPJ</Label>
                <Input {...form.register("document")} disabled={!!editing} />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input {...form.register("phone")} />
              </div>
              <div className="space-y-1">
                <Label>E-mail</Label>
                <Input type="email" {...form.register("email")} />
              </div>
              <div className="space-y-1">
                <Label>Renda mensal (opcional)</Label>
                <Input placeholder="ex: 8500.50" {...form.register("monthly_income")} />
              </div>
              <div className="space-y-1">
                <Label>Observações</Label>
                <Input {...form.register("notes")} />
              </div>
              {save.error && <p className="text-sm text-red-600">Erro ao salvar. Verifique os dados.</p>}
              <Button type="submit" disabled={save.isPending}>
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
          <CardDescription>Busque por nome, e-mail ou documento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Renda</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(list.data?.items ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.document}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell>{c.monthly_income ? formatBRL(c.monthly_income) : "—"}</TableCell>
                  <TableCell>{formatDate(c.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(c);
                        setOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
