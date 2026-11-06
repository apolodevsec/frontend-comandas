import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Comanda, Destino, EntregaPendente, TicketDePreparo } from "@/domain/tipos";
import { INTERVALO_DE_POLLING, chamar } from "./cliente";
import { chaves } from "./chaves";

export function useTicketsDePreparo(destino: Destino) {
  return useQuery({
    queryKey: chaves.preparo(destino),
    queryFn: () => chamar<TicketDePreparo[]>("/preparo", { parametros: { destino } }),
    refetchInterval: INTERVALO_DE_POLLING,
  });
}

export function useEntregasPendentes() {
  return useQuery({
    queryKey: chaves.entregas,
    queryFn: () => chamar<EntregaPendente[]>("/entregas"),
    refetchInterval: INTERVALO_DE_POLLING,
  });
}

function useInvalidarTudo() {
  const cliente = useQueryClient();
  return () => cliente.invalidateQueries();
}

export function useAvancarPreparo() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: (entrada: { pedidoId: string; destino: Destino }) =>
      chamar<Comanda>(`/pedidos/${entrada.pedidoId}/avancar`, {
        metodo: "POST",
        corpo: { destino: entrada.destino },
      }),
    onSuccess: invalidar,
  });
}

export function useEntregarPedido() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: (pedidoId: string) =>
      chamar<Comanda>(`/pedidos/${pedidoId}/entregar`, { metodo: "POST" }),
    onSuccess: invalidar,
  });
}

export function useCancelarPedido() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: (pedidoId: string) =>
      chamar<Comanda>(`/pedidos/${pedidoId}/cancelar`, { metodo: "POST" }),
    onSuccess: invalidar,
  });
}
