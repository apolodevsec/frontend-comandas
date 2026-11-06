import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { Papel } from "@/domain/tipos";
import { useSessao } from "./sessao";

/** Guarda de rota por papel: sem sessao vai para /entrar, com papel errado para /sem-permissao. */
export function RotaProtegida({ papeis }: { papeis: Papel[] }) {
  const sessao = useSessao((estado) => estado.sessao);
  const localizacao = useLocation();

  if (sessao === null) {
    return <Navigate to="/entrar" state={{ de: localizacao.pathname }} replace />;
  }

  if (!papeis.includes(sessao.usuario.papel)) {
    return <Navigate to="/sem-permissao" replace />;
  }

  return <Outlet />;
}
