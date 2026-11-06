/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base da API. Vazio usa /api, que o worker do MSW intercepta. */
  readonly VITE_API_URL?: string;
  /** "false" desliga o mock, para apontar num backend real. */
  readonly VITE_USAR_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
