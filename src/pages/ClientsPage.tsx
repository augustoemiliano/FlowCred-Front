import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { FormField as Field } from "@/components/FormField";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api, apiErrorMessage } from "@/lib/api";
import { formatBRL, formatDate, formatDocument } from "@/lib/format";
import { type ClientForm, clientSchema, EMPTY_CLIENT_FORM, toClientPayload } from "@/lib/schemas";
import type { Client, Paginated } from "@/types/domain";

const PAGE_SIZE = 20;

export function ClientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const list = useQuery({
    queryKey: ["clients", { search: debounced, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
      if (debounced) params.set("search", debounced);
      return (await api.get<Paginated<Client>>(`/clients?${params}`)).data;
    },
    placeholderData: keepPreviousData,
  });

  const form = useForm<ClientForm>({ resolver: zodResolver(clientSchema), defaultValues: EMPTY_CLIENT_FORM });

  const openForm = (client: Client | null) => {
    setEditing(client);
    form.reset(
      client
        ? {
            name: client.name,
            document: client.document,
            phone: client.phone,
            email: client.email,
            monthly_income: client.monthly_income ?? "",
            notes: client.notes ?? "",
          }
        : EMPTY_CLIENT_FORM,
    );
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async (values: ClientForm) => {
      const payload = toClientPayload(values);
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

  const remove = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: async () => {
      setListError(null);
      await qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e) => setListError(apiErrorMessage(e, "Não foi possível excluir o cliente.")),
  });

  const errors = form.formState.errors;
  const data = list.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Cadastro e busca rápida</p>
        </div>
        <Button onClick={() => openForm(null)}>Novo cliente</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
          <CardDescription>Busque por nome, e-mail ou CPF/CNPJ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            aria-label="Buscar clientes"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {listError && (
            <p role="alert" className="text-sm text-red-600">
              {listError}
            </p>
          )}
          {list.error && <p className="text-sm text-red-600">{apiErrorMessage(list.error, "Erro ao carregar clientes.")}</p>}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Renda</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDocument(c.document)}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell className="whitespace-nowrap">{c.phone}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatBRL(c.monthly_income)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(c.created_at)}</TableCell>
                    <TableCell className="space-x-2 whitespace-nowrap text-right">
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/propostas?client_id=${c.id}`}>Propostas</Link>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openForm(c)}>
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        disabled={remove.isPending}
                        onClick={() => {
                          if (window.confirm(`Excluir o cliente "${c.name}"?`)) remove.mutate(c.id);
                        }}
                      >
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {data && data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                      {debounced ? "Nenhum cliente encontrado para esta busca." : "Nenhum cliente cadastrado."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {data && <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />}
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            noValidate
            onSubmit={form.handleSubmit(async (v) => {
              try {
                await save.mutateAsync(v);
              } catch (e) {
                form.setError("root", { message: apiErrorMessage(e) });
              }
            })}
          >
            <Field label="Nome" htmlFor="c-name" error={errors.name?.message}>
              <Input id="c-name" {...form.register("name")} />
            </Field>
            <Field label="CPF/CNPJ" htmlFor="c-document" error={errors.document?.message}>
              <Input
                id="c-document"
                {...form.register("document")}
                readOnly={!!editing}
                className={editing ? "bg-muted" : undefined}
                placeholder="11 dígitos (CPF) ou 14 (CNPJ)"
              />
            </Field>
            <Field label="Telefone" htmlFor="c-phone" error={errors.phone?.message}>
              <Input id="c-phone" {...form.register("phone")} />
            </Field>
            <Field label="E-mail" htmlFor="c-email" error={errors.email?.message}>
              <Input id="c-email" type="email" {...form.register("email")} />
            </Field>
            <Field label="Renda mensal (opcional)" htmlFor="c-income" error={errors.monthly_income?.message}>
              <Input id="c-income" inputMode="decimal" placeholder="ex: 8500,50" {...form.register("monthly_income")} />
            </Field>
            <Field label="Observações" htmlFor="c-notes">
              <Textarea id="c-notes" {...form.register("notes")} />
            </Field>
            {errors.root && (
              <p role="alert" className="text-sm text-red-600">
                {errors.root.message}
              </p>
            )}
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

