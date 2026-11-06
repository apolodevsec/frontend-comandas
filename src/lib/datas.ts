/** "19:42" a partir de um ISO. Sem dependencia de locale, como em lib/money.ts. */
export function horaCurta(iso: string): string {
  const data = new Date(iso);
  const hora = String(data.getHours()).padStart(2, "0");
  const minuto = String(data.getMinutes()).padStart(2, "0");
  return `${hora}:${minuto}`;
}

/** Minutos decorridos desde o ISO, para o painel de preparo. */
export function minutosDesde(iso: string, agora = new Date()): number {
  const diferenca = agora.getTime() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diferenca / 60000));
}
