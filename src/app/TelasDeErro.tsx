import { Link } from "react-router-dom";
import { Cartao} from "@/components/ui";
import { estilosDeBotao } from "@/components/ui/estilos";

function Moldura({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex min-h-full items-center justify-center bg-fundo p-4">
      <Cartao className="w-full max-w-md p-6 text-center">
        <h1 className="text-xl font-semibold text-texto">{titulo}</h1>
        <p className="mt-2 text-sm text-texto-suave">{texto}</p>
        <Link to="/" className={estilosDeBotao({ largura: "cheia", className: "mt-5" })}>
          Voltar ao inicio
        </Link>
      </Cartao>
    </div>
  );
}

export function NaoEncontradoTela() {
  return <Moldura titulo="Pagina nao encontrada" texto="O endereco acessado nao existe." />;
}

export function SemPermissaoTela() {
  return (
    <Moldura
      titulo="Sem permissao"
      texto="Seu papel nao tem acesso a esta area. Entre com um usuario do papel correto."
    />
  );
}
