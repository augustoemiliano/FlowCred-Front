import { clientSchema, parseMoney, proposalSchema, toClientPayload, toProposalPayload } from "@/lib/schemas";

const baseProposal = {
  client_id: "1",
  bank: "Caixa",
  property_value: "450.000,00",
  financed_amount: "320000",
  responsible_user_id: "1",
  next_stage_date: "",
  notes: "",
  observation: "",
};

describe("parseMoney", () => {
  it.each([
    ["8500.50", 8500.5],
    ["8500,50", 8500.5],
    ["8.500,50", 8500.5],
    ["450.000", 450000],
    ["", Number.NaN],
  ])("%s -> %s", (input, expected) => {
    expect(parseMoney(input)).toBe(expected);
  });
});

describe("clientSchema", () => {
  it("aceita CPF com máscara e converte payload", () => {
    const parsed = clientSchema.parse({
      name: " Maria ",
      document: "529.982.247-25",
      phone: "11987654321",
      email: "maria@example.com",
      monthly_income: "8.500,00",
      notes: "",
    });
    expect(toClientPayload(parsed)).toEqual({
      name: "Maria",
      document: "529.982.247-25",
      phone: "11987654321",
      email: "maria@example.com",
      notes: null,
      monthly_income: "8500.00",
    });
  });

  it("rejeita documento com tamanho inválido", () => {
    const res = clientSchema.safeParse({
      name: "X",
      document: "123",
      phone: "11987654321",
      email: "x@example.com",
      monthly_income: "",
      notes: "",
    });
    expect(res.success).toBe(false);
  });
});

describe("proposalSchema", () => {
  it("converte valores para o payload da API", () => {
    const parsed = proposalSchema.parse(baseProposal);
    expect(toProposalPayload(parsed)).toEqual({
      client_id: 1,
      bank: "Caixa",
      property_value: "450000.00",
      financed_amount: "320000.00",
      responsible_user_id: 1,
      next_stage_date: null,
      notes: null,
    });
  });

  it("rejeita financiado maior que o imóvel", () => {
    const res = proposalSchema.safeParse({ ...baseProposal, financed_amount: "500000" });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].path).toEqual(["financed_amount"]);
    }
  });

  it("rejeita valores zerados", () => {
    expect(proposalSchema.safeParse({ ...baseProposal, property_value: "0" }).success).toBe(false);
  });
});
