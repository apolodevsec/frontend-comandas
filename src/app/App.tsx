import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RotaProtegida } from "@/features/auth/RotaProtegida";
import { EntrarTela } from "@/features/auth/EntrarTela";
import { rotaInicialDoPapel, useSessao } from "@/features/auth/sessao";
import { AbrirAvulsaTela } from "@/features/salao/AbrirAvulsaTela";
import { ComandaTela } from "@/features/salao/ComandaTela";
import { EntregasTela } from "@/features/salao/EntregasTela";
import { LancamentoTela } from "@/features/salao/LancamentoTela";
import { MapaDeMesasTela } from "@/features/salao/MapaDeMesasTela";
import { PainelDePreparoTela } from "@/features/preparo/PainelDePreparoTela";
import { ComandaLeituraTela } from "@/features/caixa/ComandaLeituraTela";
import { FechamentoTela } from "@/features/caixa/FechamentoTela";
import { FilaDoCaixaTela } from "@/features/caixa/FilaDoCaixaTela";
import { PagamentoTela } from "@/features/caixa/PagamentoTela";
import { observarOutrasAbas } from "@/mocks/store";
import { LayoutDeDesktop, LayoutDoSalao } from "./Layouts";
import { criarClienteDeQuery } from "./query";
import { NaoEncontradoTela, SemPermissaoTela } from "./TelasDeErro";

/** Outra aba escreveu no store do mock: revalida tudo (docs/adr/0001). */
function EscutaDeOutrasAbas() {
  const cliente = useQueryClient();
  useEffect(() => observarOutrasAbas(() => void cliente.invalidateQueries()), [cliente]);
  return null;
}

function Inicio() {
  const sessao = useSessao((estado) => estado.sessao);
  if (sessao === null) return <Navigate to="/entrar" replace />;
  return <Navigate to={rotaInicialDoPapel(sessao.usuario.papel)} replace />;
}

export function Rotas() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/entrar" element={<EntrarTela />} />
      <Route path="/sem-permissao" element={<SemPermissaoTela />} />

      <Route element={<RotaProtegida papeis={["garcom"]} />}>
        <Route path="/salao" element={<LayoutDoSalao />}>
          <Route index element={<MapaDeMesasTela />} />
          <Route path="avulsa" element={<AbrirAvulsaTela />} />
          <Route path="entregas" element={<EntregasTela />} />
          <Route path="comandas/:comandaId" element={<ComandaTela />} />
          <Route path="comandas/:comandaId/lancar" element={<LancamentoTela />} />
        </Route>
      </Route>

      <Route element={<RotaProtegida papeis={["cozinha", "bar"]} />}>
        <Route path="/preparo" element={<LayoutDeDesktop />}>
          <Route index element={<PainelDePreparoTela />} />
        </Route>
      </Route>

      <Route element={<RotaProtegida papeis={["caixa"]} />}>
        <Route path="/caixa" element={<LayoutDeDesktop />}>
          <Route index element={<FilaDoCaixaTela />} />
          <Route path="comandas/:comandaId" element={<ComandaLeituraTela />} />
          <Route path="comandas/:comandaId/fechamento" element={<FechamentoTela />} />
          <Route path="comandas/:comandaId/pagamento" element={<PagamentoTela />} />
        </Route>
      </Route>

      <Route path="*" element={<NaoEncontradoTela />} />
    </Routes>
  );
}

export function App() {
  const cliente = criarClienteDeQuery();
  return (
    <QueryClientProvider client={cliente}>
      <EscutaDeOutrasAbas />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Rotas />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
