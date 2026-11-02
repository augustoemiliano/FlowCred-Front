export type ProposalStatus =
  | "ANALISE_CREDITO"
  | "LAUDO"
  | "JURIDICO"
  | "CONTRATO"
  | "REGISTRO"
  | "PAGAMENTO_VENDEDOR"
  | "FINALIZADO"
  | "CANCELADO";

export const PROPOSAL_STATUS_OPTIONS: { value: ProposalStatus; label: string }[] = [
  { value: "ANALISE_CREDITO", label: "Análise de crédito" },
  { value: "LAUDO", label: "Laudo" },
  { value: "JURIDICO", label: "Jurídico" },
  { value: "CONTRATO", label: "Contrato" },
  { value: "REGISTRO", label: "Registro" },
  { value: "PAGAMENTO_VENDEDOR", label: "Pagamento vendedor" },
  { value: "FINALIZADO", label: "Finalizado" },
  { value: "CANCELADO", label: "Cancelado" },
];

export function proposalStatusLabel(s: string) {
  return PROPOSAL_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}

export type Client = {
  id: number;
  name: string;
  document: string;
  phone: string;
  email: string;
  monthly_income: string | null;
  notes: string | null;
  created_at: string;
};

export type Proposal = {
  id: number;
  client_id: number;
  bank: string;
  property_value: string;
  financed_amount: string;
  status: ProposalStatus | string;
  responsible_user_id: number;
  next_stage_date: string | null;
  notes: string | null;
  created_at: string;
};

export type UserMinimal = { id: number; username: string };

export type ProposalDetail = Proposal & {
  client: { id: number; name: string; document: string };
  responsible: UserMinimal;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

export const HISTORY_ACTION_LABELS: Record<string, string> = {
  CREATED: "Proposta criada",
  UPDATED: "Dados atualizados",
  STATUS_CHANGED: "Mudança de etapa",
  CHECKLIST_UPDATED: "Checklist atualizado",
  DOCUMENT_ADDED: "Documento anexado",
  DOCUMENT_REMOVED: "Documento removido",
};

export function historyActionLabel(action: string) {
  return HISTORY_ACTION_LABELS[action] ?? action;
}

export type ChecklistItem = {
  id: number;
  proposal_id: number;
  title: string;
  is_done: boolean;
  sort_order: number;
};

export type HistoryEntry = {
  id: number;
  proposal_id: number;
  user_id: number;
  user_username: string | null;
  action: string;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  created_at: string;
};

export type DocumentMeta = {
  id: number;
  proposal_id: number;
  display_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export type DashboardSummary = {
  total_proposals: number;
  proposals_em_analise: number;
  proposals_juridico: number;
  proposals_finalizadas: number;
  total_financed_amount: string;
  proposals_by_status: Record<string, number>;
  proposals_by_bank: Record<string, number>;
};
