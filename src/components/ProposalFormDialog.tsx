import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { api, apiErrorMessage } from "@/lib/api";
import { formatDocument } from "@/lib/format";
import { type ProposalForm, proposalSchema, toProposalPayload } from "@/lib/schemas";
import type { Client, Paginated, ProposalDetail, UserMinimal } from "@/types/domain";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Proposta a editar; `null` = criação. */
  proposal: ProposalDetail | null;
  defaultClientId?: number;
  onSubmit: (payload: ReturnType<typeof toProposalPayload> & { observation: string | null }) => Promise<void>;
};

function initialValues(proposal: ProposalDetail | null, fallbackClient?: number, fallbackUser?: number): ProposalForm {
  if (proposal) {
    return {
      client_id: String(proposal.client_id),
      bank: proposal.bank,
      property_value: proposal.property_value,
      financed_amount: proposal.financed_amount,
      responsible_user_id: String(proposal.responsible_user_id),
      next_stage_date: proposal.next_stage_date ?? "",
      notes: proposal.notes ?? "",
      observation: "",
    };
  }
  return {
    client_id: fallbackClient ? String(fallbackClient) : "",
    bank: "",
    property_value: "",
    financed_amount: "",
    responsible_user_id: fallbackUser ? String(fallbackUser) : "",
    next_stage_date: "",
    notes: "",
    observation: "",
  };
}

export function ProposalFormDialog({ open, onOpenChange, proposal, defaultClientId, onSubmit }: Props) {
  const { me } = useAuth();

  const clients = useQuery({
    // Prefixo ["clients"] para que as mutações da página de clientes invalidem esta lista.
    // A API limita page_size a 100.
    queryKey: ["clients", "all-for-select"],
    queryFn: async () => (await api.get<Paginated<Client>>("/clients?page=1&page_size=100")).data,
    enabled: open,
  });

  const users = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<UserMinimal[]>("/users")).data,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<ProposalForm>({
    resolver: zodResolver(proposalSchema),
    defaultValues: initialValues(proposal, defaultClientId, me?.id),
  });

  const loadedClients = clients.data?.items ?? [];
  // Na edição, garante que o cliente atual aparece mesmo que não esteja entre os 100 primeiros.
  const clientItems: Pick<Client, "id" | "name" | "document">[] =
    proposal && !loadedClients.some((c) => c.id === proposal.client_id)
      ? [proposal.client, ...loadedClients]
      : loadedClients;
  const firstClientId = clientItems[0]?.id;

  useEffect(() => {
    if (open) {
      form.reset(initialValues(proposal, defaultClientId ?? firstClientId, me?.id));
    }
  }, [open, proposal, defaultClientId, firstClientId, me?.id, form]);

  const hasClients = clientItems.length > 0;
  const errors = form.formState.errors;
  const isEdit = proposal !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Editar proposta #${proposal.id}` : "Nova proposta"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          noValidate
          onSubmit={form.handleSubmit(async (v) => {
            try {
              await onSubmit({ ...toProposalPayload(v), observation: v.observation.trim() || null });
            } catch (e) {
              form.setError("root", { message: apiErrorMessage(e) });
            }
          })}
        >
          {clients.isSuccess && !hasClients && (
            <p className="text-sm text-amber-800">
              Não há clientes cadastrados.{" "}
              <Link className="font-medium underline" to="/clientes">
                Cadastre um cliente
              </Link>{" "}
              antes de criar a proposta.
            </p>
          )}
          <FormField label="Cliente" htmlFor="p-client" error={errors.client_id?.message}>
            <NativeSelect id="p-client" disabled={!hasClients} {...form.register("client_id")}>
              {clientItems.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} — {formatDocument(c.document)}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Banco" htmlFor="p-bank" error={errors.bank?.message}>
            <Input id="p-bank" placeholder="ex.: Caixa, Itaú, Bradesco…" {...form.register("bank")} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Valor do imóvel (R$)" htmlFor="p-property" error={errors.property_value?.message}>
              <Input id="p-property" inputMode="decimal" placeholder="450000,00" {...form.register("property_value")} />
            </FormField>
            <FormField label="Valor financiado (R$)" htmlFor="p-financed" error={errors.financed_amount?.message}>
              <Input id="p-financed" inputMode="decimal" placeholder="320000,00" {...form.register("financed_amount")} />
            </FormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Responsável" htmlFor="p-responsible" error={errors.responsible_user_id?.message}>
              <NativeSelect id="p-responsible" {...form.register("responsible_user_id")}>
                {(users.data ?? []).map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.username}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Próxima etapa (data)" htmlFor="p-next" error={errors.next_stage_date?.message}>
              <Input id="p-next" type="date" {...form.register("next_stage_date")} />
            </FormField>
          </div>
          <FormField label="Observações" htmlFor="p-notes">
            <Textarea id="p-notes" {...form.register("notes")} />
          </FormField>
          {isEdit && (
            <FormField label="Motivo da alteração (vai para o histórico)" htmlFor="p-observation">
              <Input id="p-observation" {...form.register("observation")} />
            </FormField>
          )}
          {errors.root && (
            <p role="alert" className="text-sm text-red-600">
              {errors.root.message}
            </p>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting || !hasClients}>
            {form.formState.isSubmitting ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar proposta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
