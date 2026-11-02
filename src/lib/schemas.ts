import { z } from "zod";

/** Converte "8.500,50" / "8500,50" / "8500.50" em número (NaN se inválido). */
export function parseMoney(value: string): number {
  const v = value.trim();
  if (!v) return Number.NaN;
  if (v.includes(",")) return Number(v.replace(/\./g, "").replace(",", "."));
  // "450.000" em pt-BR = quatrocentos e cinquenta mil (pontos como separador de milhar)
  if (/^\d{1,3}(\.\d{3})+$/.test(v)) return Number(v.replace(/\./g, ""));
  return Number(v);
}

const money = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Informe o ${label}`)
    .refine((v) => {
      const n = parseMoney(v);
      return Number.isFinite(n) && n > 0;
    }, `${label[0].toUpperCase()}${label.slice(1)} deve ser maior que zero`);

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome"),
  document: z
    .string()
    .trim()
    .refine((v) => [11, 14].includes(v.replace(/\D/g, "").length), "CPF deve ter 11 dígitos ou CNPJ 14 dígitos"),
  phone: z.string().trim().min(8, "Telefone deve ter pelo menos 8 caracteres"),
  email: z.string().trim().email("E-mail inválido"),
  monthly_income: z
    .string()
    .trim()
    .refine((v) => v === "" || (Number.isFinite(parseMoney(v)) && parseMoney(v) >= 0), "Valor inválido"),
  notes: z.string(),
});

export type ClientForm = z.infer<typeof clientSchema>;

export const EMPTY_CLIENT_FORM: ClientForm = {
  name: "",
  document: "",
  phone: "",
  email: "",
  monthly_income: "",
  notes: "",
};

export function toClientPayload(values: ClientForm) {
  return {
    name: values.name,
    document: values.document,
    phone: values.phone,
    email: values.email,
    notes: values.notes.trim() ? values.notes.trim() : null,
    monthly_income: values.monthly_income ? parseMoney(values.monthly_income).toFixed(2) : null,
  };
}

export const proposalSchema = z
  .object({
    client_id: z.string().min(1, "Selecione o cliente"),
    bank: z.string().trim().min(1, "Informe o banco"),
    property_value: money("valor do imóvel"),
    financed_amount: money("valor financiado"),
    responsible_user_id: z.string().min(1, "Selecione o responsável"),
    next_stage_date: z.string(),
    notes: z.string(),
    observation: z.string(),
  })
  .refine((v) => parseMoney(v.financed_amount) <= parseMoney(v.property_value), {
    message: "O valor financiado não pode ser maior que o valor do imóvel",
    path: ["financed_amount"],
  });

export type ProposalForm = z.infer<typeof proposalSchema>;

export function toProposalPayload(values: ProposalForm) {
  return {
    client_id: Number(values.client_id),
    bank: values.bank,
    property_value: parseMoney(values.property_value).toFixed(2),
    financed_amount: parseMoney(values.financed_amount).toFixed(2),
    responsible_user_id: Number(values.responsible_user_id),
    next_stage_date: values.next_stage_date || null,
    notes: values.notes.trim() ? values.notes.trim() : null,
  };
}
