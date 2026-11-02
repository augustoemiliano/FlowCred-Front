import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ClientsPage } from "@/pages/ClientsPage";
import { renderWithProviders } from "@/test/utils";

const { get, post, put, del } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: { get, post, put, delete: del } };
});

const CLIENT = {
  id: 7,
  name: "Cliente demonstração FlowCred",
  document: "52998224725",
  phone: "11987654321",
  email: "cliente.demo@flowcred.local",
  monthly_income: "5500.00",
  notes: null,
  created_at: "2026-05-01T12:00:00Z",
};

describe("ClientsPage", () => {
  beforeEach(() => {
    get.mockReset().mockResolvedValue({ data: { items: [CLIENT], total: 1, page: 1, page_size: 20 } });
    post.mockReset().mockResolvedValue({ data: CLIENT });
  });

  it("lista clientes com documento formatado", async () => {
    renderWithProviders(<ClientsPage />, { route: "/clientes", path: "/clientes" });
    const row = (await screen.findByText(CLIENT.name)).closest("tr")!;
    expect(within(row).getByText("529.982.247-25")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("/clients?page=1&page_size=20");
  });

  it("valida o formulário antes de enviar e cria cliente", async () => {
    renderWithProviders(<ClientsPage />, { route: "/clientes", path: "/clientes" });
    await screen.findByText(CLIENT.name);

    await userEvent.click(screen.getByRole("button", { name: "Novo cliente" }));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Informe o nome")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText("Nome"), "Ana");
    await userEvent.type(screen.getByLabelText("CPF/CNPJ"), "111.444.777-35");
    await userEvent.type(screen.getByLabelText("Telefone"), "11999998888");
    await userEvent.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await vi.waitFor(() =>
      expect(post).toHaveBeenCalledWith("/clients", {
        name: "Ana",
        document: "111.444.777-35",
        phone: "11999998888",
        email: "ana@example.com",
        notes: null,
        monthly_income: null,
      }),
    );
  });
});
