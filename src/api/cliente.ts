import type { Papel } from "@/domain/tipos";

/**
 * Unico lugar do app que fala HTTP. Para acoplar ao backend real basta apontar
 * VITE_API_URL e parar de registrar o worker do MSW em main.tsx (docs/adr/0001).
 */
const BASE = import.meta.env.VITE_API_URL ?? "/api";

export class ErroDaApi extends Error {
  readonly codigo: string;
  readonly status: number;

  constructor(status: number, codigo: string, mensagem: string) {
    super(mensagem);
    this.name = "ErroDaApi";
    this.status = status;
    this.codigo = codigo;
  }
}

interface Identidade {
  papel: Papel | null;
  token: string | null;
}

let identidade: Identidade = { papel: null, token: null };

/**
 * O papel vai no header porque o mock nao tem como ler um JWT. No backend real,
 * o papel sai do token e este header deixa de ser necessario.
 */
export function configurarIdentidade(nova: Identidade): void {
  identidade = nova;
}

export interface OpcoesDaChamada {
  metodo?: "GET" | "POST" | "PATCH" | "DELETE";
  corpo?: unknown;
  parametros?: Record<string, string | undefined>;
}

export async function chamar<T>(caminho: string, opcoes: OpcoesDaChamada = {}): Promise<T> {
  const { metodo = "GET", corpo, parametros } = opcoes;

  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(parametros ?? {})) {
    if (valor !== undefined) busca.set(chave, valor);
  }
  const consulta = busca.size > 0 ? `?${busca.toString()}` : "";

  const cabecalhos: Record<string, string> = { "content-type": "application/json" };
  if (identidade.papel !== null) cabecalhos["x-papel"] = identidade.papel;
  if (identidade.token !== null) cabecalhos.authorization = `Bearer ${identidade.token}`;

  const resposta = await fetch(`${BASE}${caminho}${consulta}`, {
    method: metodo,
    headers: cabecalhos,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });

  if (resposta.status === 204) return undefined as T;

  const dados: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const detalhe = (dados as { erro?: { codigo?: string; mensagem?: string } } | null)?.erro;
    throw new ErroDaApi(
      resposta.status,
      detalhe?.codigo ?? "ERRO_DESCONHECIDO",
      detalhe?.mensagem ?? "Nao foi possivel completar a operacao.",
    );
  }

  return dados as T;
}

/**
 * Intervalo de revalidacao dos paineis. Ponto unico de troca: quando o backend
 * expuser WebSocket, este polling sai daqui e nada mais muda (docs/adr/0001).
 */
export const INTERVALO_DE_POLLING = 3000;
