/** Formatadores pt-BR compartilhados pelos painéis. */

export const numeroBR = (valor: number | null | undefined): string =>
  new Intl.NumberFormat("pt-BR").format(Number(valor ?? 0));

export const percentualBR = (valor: number | null | undefined): string =>
  valor === null || valor === undefined ? "—" : `${numeroBR(Math.round(valor))}%`;

export const dataHoraBR = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

export const ROTULOS_STATUS: Record<string, string> = {
  solicitado: "Solicitado",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  negado: "Negado",
  entregue: "Entregue",
};

export const CORES_STATUS: Record<string, string> = {
  solicitado: "#AEAEB2",
  em_analise: "#FF9F0A",
  aprovado: "#34C759",
  negado: "#FF3B30",
  entregue: "#1B4F8C",
};
