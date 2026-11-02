import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProposalDetailPage } from "@/pages/ProposalDetailPage";
import { renderWithProviders } from "@/test/utils";

const { get, patch } = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: { get, patch, post: vi.fn(), put: vi.fn(), delete: vi.fn() } };
});

const PROPOSAL = {
  id: 3,
  client_id: 1,
  bank: "Itaú",
  property_value: "520000.00",
  financed_amount: "390000.00",
  status: "JURIDICO",
  responsible_user_id: 1,
  next_stage_date: "2026-12-01",
  notes: null,
  created_at: "2026-05-01T12:00:00Z",
  client: { id: 1, name: "Carlos Eduardo Menezes", document: "98765432100" },
  responsible: { id: 1, username: "admin" },
};

const RESPONSES: Record<string, unknown> = {
  "/proposals/3": PROPOSAL,
  "/proposals/3/checklist": [
    { id: 1, proposal_id: 3, title: "Documentos do comprador conferidos", is_done: true, sort_order: 0 },
    { id: 2, proposal_id: 3, title: "Laudo solicitado", is_done: false, sort_order: 1 },
  ],
  "/proposals/3/history": [
    {
      id: 2,
      proposal_id: 3,
      user_id: 1,
      user_username: "admin",
      action: "STATUS_CHANGED",
      old_status: "LAUDO",
      new_status: "JURIDICO",
      note: "Enviado ao jurídico",
      created_at: "2026-05-02T12:00:00Z",
    },
  ],
  "/proposals/3/documents": [],
};

describe("ProposalDetailPage", () => {
  beforeEach(() => {
    get.mockReset().mockImplementation(async (url: string) => ({ data: RESPONSES[url] }));
    patch.mockReset().mockResolvedValue({ data: {} });
  });

  const renderPage = () => renderWithProviders(<ProposalDetailPage />, { route: "/propostas/3", path: "/propostas/:id" });

  it("mostra resumo, checklist, histórico e data sem deslocamento de fuso", async () => {
    renderPage();
    expect(await screen.findByRole("heading", { name: "Proposta #3" })).toBeInTheDocument();
    expect(screen.getByText("987.654.321-00")).toBeInTheDocument();
    expect(screen.getByText("01/12/2026")).toBeInTheDocument();
    expect(await screen.findByText("1 de 2 itens concluídos")).toBeInTheDocument();
    expect(screen.getByText("Mudança de etapa")).toBeInTheDocument();
    expect(screen.getByText("Laudo → Jurídico")).toBeInTheDocument();
    expect(screen.getByText("Nenhum documento anexado.")).toBeInTheDocument();
  });

  it("muda a etapa e não oferece a etapa atual", async () => {
    renderPage();
    const select = await screen.findByLabelText("Nova etapa");
    expect(within(select).queryByRole("option", { name: "Jurídico" })).toBeNull();

    await userEvent.selectOptions(select, "CONTRATO");
    await userEvent.type(screen.getByLabelText("Observação (opcional)"), "Contrato emitido");
    await userEvent.click(screen.getByRole("button", { name: "Atualizar etapa" }));

    await vi.waitFor(() =>
      expect(patch).toHaveBeenCalledWith("/proposals/3/status", { status: "CONTRATO", note: "Contrato emitido" }),
    );
  });
});
