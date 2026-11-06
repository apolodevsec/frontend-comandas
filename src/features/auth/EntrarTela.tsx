import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useEntrar } from "@/api/sessao";
import { ErroDaApi } from "@/api/cliente";
import { AvisoDeErro, Botao, Campo, Cartao } from "@/components/ui";
import { rotaInicialDoPapel, useSessao } from "./sessao";

/** Tela 1. Login contra o mock; no backend real muda so a origem da resposta. */
export function EntrarTela() {
  const sessao = useSessao((estado) => estado.sessao);
  const entrar = useSessao((estado) => estado.entrar);
  const navegar = useNavigate();
  const autenticar = useEntrar();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  if (sessao !== null) {
    return <Navigate to={rotaInicialDoPapel(sessao.usuario.papel)} replace />;
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    autenticar.mutate(
      { usuario: usuario.trim(), senha },
      {
        onSuccess: (resposta) => {
          entrar(resposta);
          navegar(rotaInicialDoPapel(resposta.usuario.papel), { replace: true });
        },
      },
    );
  }

  const mensagemDeErro =
    autenticar.error instanceof ErroDaApi ? autenticar.error.message : null;

  return (
    <div className="flex min-h-full items-center justify-center bg-fundo p-4">
      <Cartao className="w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold text-texto">Comandas</h1>
        <p className="mt-1 text-sm text-texto-suave">Entre para comecar o turno.</p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={enviar}>
          <Campo
            etiqueta="Usuario"
            name="usuario"
            autoComplete="username"
            autoCapitalize="none"
            value={usuario}
            onChange={(evento) => setUsuario(evento.target.value)}
            required
          />
          <Campo
            etiqueta="Senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            required
          />

          {mensagemDeErro !== null ? <AvisoDeErro mensagem={mensagemDeErro} /> : null}

          <Botao type="submit" tamanho="lg" largura="cheia" carregando={autenticar.isPending}>
            Entrar
          </Botao>
        </form>

        <div className="mt-6 rounded-lg bg-fundo p-3 text-xs text-texto-suave">
          <p className="font-medium text-texto">Usuarios de demonstracao</p>
          <p className="mt-1">
            <code>u-1</code> garcom · <code>u-2</code> cozinha · <code>u-3</code> bar ·{" "}
            <code>u-4</code> caixa
          </p>
          <p>
            Senha: <code>123456</code>
          </p>
        </div>
      </Cartao>
    </div>
  );
}
