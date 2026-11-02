import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";

import { LoginPage } from "@/pages/LoginPage";
import { renderWithProviders } from "@/test/utils";

const { post, get } = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: { post, get } };
});

function unauthorized() {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("401", "ERR", config, null, {
    status: 401,
    statusText: "",
    data: { detail: "Usuário ou senha incorretos" },
    headers: {},
    config,
  });
}

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    post.mockReset();
    get.mockReset();
  });

  it("valida campos obrigatórios", async () => {
    renderWithProviders(<LoginPage />, { route: "/login", path: "/login" });
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("Informe o usuário")).toBeInTheDocument();
    expect(screen.getByText("Informe a senha")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("mostra erro com credenciais inválidas", async () => {
    post.mockRejectedValueOnce(unauthorized());
    renderWithProviders(<LoginPage />, { route: "/login", path: "/login" });
    await userEvent.type(screen.getByLabelText("Usuário"), "admin");
    await userEvent.type(screen.getByLabelText("Senha"), "errada");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Usuário ou senha incorretos.");
    expect(localStorage.getItem("fc_token")).toBeNull();
  });

  it("guarda o token e redireciona após login", async () => {
    post.mockResolvedValueOnce({ data: { access_token: "jwt-token", token_type: "bearer" } });
    get.mockResolvedValue({ data: { id: 1, username: "admin", is_active: true, is_superuser: true, created_at: "" } });
    renderWithProviders(<LoginPage />, { route: "/login", path: "/login" });
    await userEvent.type(screen.getByLabelText("Usuário"), "admin");
    await userEvent.type(screen.getByLabelText("Senha"), "admin");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(screen.getByText("home")).toBeInTheDocument());
    expect(post).toHaveBeenCalledWith("/auth/login", { username: "admin", password: "admin" });
    expect(localStorage.getItem("fc_token")).toBe("jwt-token");
  });
});
