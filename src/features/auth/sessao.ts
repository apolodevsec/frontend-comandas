import { create } from "zustand";
import { configurarIdentidade } from "@/api/cliente";
import type { Papel, Usuario } from "@/domain/tipos";

/**
 * Sessao fake sobre o mock. Quando o backend trouxer autenticacao de verdade,
 * o token passa a vir dele e nada mais aqui muda.
 */
export interface Sessao {
  token: string;
  usuario: Usuario;
}

const CHAVE = "comandas:sessao:v1";

function lerSessaoSalva(): Sessao | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto === null ? null : (JSON.parse(bruto) as Sessao);
  } catch {
    return null;
  }
}

function gravarSessao(sessao: Sessao | null): void {
  try {
    if (sessao === null) localStorage.removeItem(CHAVE);
    else localStorage.setItem(CHAVE, JSON.stringify(sessao));
  } catch {
    // Navegacao privada sem storage: a sessao vive apenas em memoria.
  }
}

interface EstadoDaSessao {
  sessao: Sessao | null;
  entrar: (sessao: Sessao) => void;
  sair: () => void;
}

const sessaoInicial = lerSessaoSalva();
configurarIdentidade({
  papel: sessaoInicial?.usuario.papel ?? null,
  token: sessaoInicial?.token ?? null,
});

export const useSessao = create<EstadoDaSessao>((set) => ({
  sessao: sessaoInicial,
  entrar: (sessao) => {
    gravarSessao(sessao);
    configurarIdentidade({ papel: sessao.usuario.papel, token: sessao.token });
    set({ sessao });
  },
  sair: () => {
    gravarSessao(null);
    configurarIdentidade({ papel: null, token: null });
    set({ sessao: null });
  },
}));

/** Para onde cada papel vai depois de entrar. */
export function rotaInicialDoPapel(papel: Papel): string {
  if (papel === "garcom") return "/salao";
  if (papel === "caixa") return "/caixa";
  return "/preparo";
}
