import { useMutation } from "@tanstack/react-query";
import type { Usuario } from "@/domain/tipos";
import { chamar } from "./cliente";

export interface RespostaDeSessao {
  token: string;
  usuario: Usuario;
}

export function useEntrar() {
  return useMutation({
    mutationFn: (credenciais: { usuario: string; senha: string }) =>
      chamar<RespostaDeSessao>("/sessao", { metodo: "POST", corpo: credenciais }),
  });
}
