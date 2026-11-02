import { formatBRL, formatBytes, formatDate, formatDateOnly, formatDocument } from "@/lib/format";

describe("format", () => {
  it("formata moeda em BRL", () => {
    expect(formatBRL("320000.00").replace(/\s/g, " ")).toBe("R$ 320.000,00");
    expect(formatBRL(null)).toBe("—");
    expect(formatBRL("abc")).toBe("—");
  });

  it("formata data sem deslocamento de fuso", () => {
    expect(formatDateOnly("2026-12-01")).toBe("01/12/2026");
    expect(formatDateOnly(null)).toBe("—");
  });

  it("formata data/hora e trata valores inválidos", () => {
    expect(formatDate("2026-05-01T12:30:00Z")).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(formatDate("não é data")).toBe("—");
  });

  it("formata CPF e CNPJ", () => {
    expect(formatDocument("52998224725")).toBe("529.982.247-25");
    expect(formatDocument("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatDocument("123")).toBe("123");
  });

  it("formata tamanho de arquivo", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2,0 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3,0 MB");
  });
});
