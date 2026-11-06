import { QueryClient } from "@tanstack/react-query";

export function criarClienteDeQuery(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: true } },
  });
}
