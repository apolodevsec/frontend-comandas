import { describe, expect, it } from "vitest";
import { formatarReais, lerReaisEmCentavos } from "./money";

describe("formatar centavos como reais", () => {
  it("formata valores do dia a dia", () => {
    expect(formatarReais(1990)).toBe("R$ 19,90");
    expect(formatarReais(0)).toBe("R$ 0,00");
    expect(formatarReais(5)).toBe("R$ 0,05");
    expect(formatarReais(100000)).toBe("R$ 1.000,00");
    expect(formatarReais(123456789)).toBe("R$ 1.234.567,89");
  });

  it("formata troco, que e negativo", () => {
    expect(formatarReais(-267)).toBe("-R$ 2,67");
  });
});

describe("ler reais digitados como centavos", () => {
  it("aceita o que o Caixa digita", () => {
    expect(lerReaisEmCentavos("19,90")).toBe(1990);
    expect(lerReaisEmCentavos("1.234,56")).toBe(123456);
    expect(lerReaisEmCentavos("20")).toBe(2000);
    expect(lerReaisEmCentavos("R$ 7,50")).toBe(750);
    expect(lerReaisEmCentavos("8.5")).toBe(850);
  });

  it("devolve null para o que nao e valor", () => {
    expect(lerReaisEmCentavos("")).toBeNull();
    expect(lerReaisEmCentavos("   ")).toBeNull();
    expect(lerReaisEmCentavos("abc")).toBeNull();
  });
});
