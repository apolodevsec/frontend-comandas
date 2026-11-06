import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./index.css";

/**
 * O mock e ligado aqui e em nenhum outro lugar. Para acoplar ao backend real:
 * VITE_USAR_MOCK=false e VITE_API_URL=https://... (docs/adr/0001).
 */
async function iniciar(): Promise<void> {
  if (import.meta.env.VITE_USAR_MOCK !== "false") {
    const { iniciarMock } = await import("./mocks/browser");
    await iniciarMock();
  }

  const raiz = document.getElementById("root");
  if (raiz === null) throw new Error("Elemento #root nao encontrado.");

  createRoot(raiz).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void iniciar();
