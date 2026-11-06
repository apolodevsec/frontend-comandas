import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Comanda,
  FormaDePagamento,
  ItemDoCardapio,
  MesaNaVisao,
  StatusComanda,
} from "@/domain/tipos";
import { INTERVALO_DE_POLLING, chamar } from "./cliente";
import { chaves } from "./chaves";

export interface ItemParaLancar {
  itemDoCardapioId: string;
  quantidade: number;
  observacao: string | null;
}

export function useCardapio() {
  return useQuery({
    queryKey: chaves.cardapio,
    queryFn: () => chamar<ItemDoCardapio[]>("/cardapio"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMesas() {
  return useQuery({
    queryKey: chaves.mesas,
    queryFn: () => chamar<MesaNaVisao[]>("/mesas"),
    refetchInterval: INTERVALO_DE_POLLING,
  });
}

export function useComandas(status?: StatusComanda) {
  return useQuery({
    queryKey: chaves.comandas(status),
    queryFn: () => chamar<Comanda[]>("/comandas", { parametros: { status } }),
    refetchInterval: INTERVALO_DE_POLLING,
  });
}

export function useComanda(id: string | undefined) {
  return useQuery({
    queryKey: chaves.comanda(id ?? ""),
    queryFn: () => chamar<Comanda>(`/comandas/${id}`),
    enabled: id !== undefined,
    refetchInterval: INTERVALO_DE_POLLING,
  });
}

/** Toda mutacao invalida tudo: o estado de uma Comanda reflete em mesas, preparo e caixa. */
function useInvalidarTudo() {
  const cliente = useQueryClient();
  return () => cliente.invalidateQueries();
}

export function useAbrirComanda() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: (entrada: { mesaId: string | null; garcomId: string }) =>
      chamar<Comanda>("/comandas", { metodo: "POST", corpo: entrada }),
    onSuccess: invalidar,
  });
}

export function useLancarRodada() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: (entrada: { comandaId: string; itens: ItemParaLancar[] }) =>
      chamar<Comanda>(`/comandas/${entrada.comandaId}/pedidos`, {
        metodo: "POST",
        corpo: { itens: entrada.itens },
      }),
    onSuccess: invalidar,
  });
}

export function useFecharComanda() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: (comandaId: string) =>
      chamar<Comanda>(`/comandas/${comandaId}/fechar`, { metodo: "POST" }),
    onSuccess: invalidar,
  });
}

export function useReabrirComanda() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: (entrada: { comandaId: string; motivo: string }) =>
      chamar<Comanda>(`/comandas/${entrada.comandaId}/reabrir`, {
        metodo: "POST",
        corpo: { motivo: entrada.motivo },
      }),
    onSuccess: invalidar,
  });
}

export function useCancelarComanda() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: (comandaId: string) =>
      chamar<Comanda>(`/comandas/${comandaId}/cancelar`, { metodo: "POST" }),
    onSuccess: invalidar,
  });
}

export function useAlternarTaxaDeServico() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: (entrada: { comandaId: string; aplicada: boolean }) =>
      chamar<Comanda>(`/comandas/${entrada.comandaId}/taxa-de-servico`, {
        metodo: "PATCH",
        corpo: { aplicada: entrada.aplicada },
      }),
    onSuccess: invalidar,
  });
}

export function useRegistrarPagamento() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: (entrada: {
      comandaId: string;
      forma: FormaDePagamento;
      valorEmCentavos: number;
    }) =>
      chamar<Comanda>(`/comandas/${entrada.comandaId}/pagamentos`, {
        metodo: "POST",
        corpo: { forma: entrada.forma, valorEmCentavos: entrada.valorEmCentavos },
      }),
    onSuccess: invalidar,
  });
}
