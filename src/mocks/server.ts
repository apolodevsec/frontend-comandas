import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Usado apenas pelos testes (Vitest). O navegador usa browser.ts. */
export const servidorDeMock = setupServer(...handlers);
