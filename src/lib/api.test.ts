import { AxiosError, AxiosHeaders } from "axios";

import { apiErrorMessage } from "@/lib/api";

function axiosError(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("erro", "ERR", config, null, {
    status,
    statusText: "",
    data,
    headers: {},
    config,
  });
}

describe("apiErrorMessage", () => {
  it("usa o detail string da API (ex.: 409)", () => {
    expect(apiErrorMessage(axiosError(409, { detail: "Já existe cliente com este CPF/CNPJ" }))).toBe(
      "Já existe cliente com este CPF/CNPJ",
    );
  });

  it("junta mensagens de validação 422 sem o prefixo do Pydantic", () => {
    const err = axiosError(422, {
      detail: [{ msg: "Value error, CPF inválido" }, { msg: "Field required" }],
    });
    expect(apiErrorMessage(err)).toBe("CPF inválido · Field required");
  });

  it("informa quando a API está inacessível", () => {
    const err = new AxiosError("Network Error", "ERR_NETWORK");
    expect(apiErrorMessage(err)).toMatch(/conectar à API/);
  });

  it("usa o fallback para erros desconhecidos", () => {
    expect(apiErrorMessage(new Error("x"), "fallback")).toBe("fallback");
  });
});
