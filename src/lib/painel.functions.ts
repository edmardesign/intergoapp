import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Contexto do usuário logado — usado para decidir quais painéis exibir. */
export interface PainelContexto {
  id: string;
  status: string;
  cargo: string;
  secretaria_id: string | null;
  municipio_id: string | null;
  is_prefeito: boolean;
  is_secretario: boolean;
}

export interface PainelKpis {
  ativos: number;
  novos_28d: number;
  pendentes: number;
  confirmacao_total: number;
  confirmacao_ok: number;
  confirmacao_pct: number | null;
  mensagens_30d: number;
}

export interface SolicitacaoCritica {
  id: string;
  item: string;
  solicitante: string | null;
  responsavel: string | null;
  dias: number;
}

export interface SolicitacoesStats {
  disponivel: boolean;
  abertas: number;
  criticas: number;
  por_status: Record<string, number>;
  top_criticas: SolicitacaoCritica[];
}

export interface UnidadeRanking {
  id: string;
  nome: string;
  total: number;
  confirmados: number;
  percentual: number;
}

export interface PainelSecretariaData {
  secretaria: { id: string; nome: string; icone: string | null };
  municipio: string;
  uf: string;
  atualizado_em: string;
  somente_leitura: boolean;
  kpis: PainelKpis;
  solicitacoes: SolicitacoesStats;
  unidades: UnidadeRanking[];
  sparkline: { semana: number; total: number }[];
}

export interface SecretariaResumo {
  id: string;
  nome: string;
  icone: string | null;
  ativos: number;
  pendentes: number;
  confirmacao_total: number;
  confirmacao_pct: number | null;
  solicitacoes_abertas: number;
  solicitacoes_criticas: number;
}

export interface AlertaMunicipio {
  tipo: string;
  severidade: "alta" | "media";
  titulo: string;
  detalhe: string;
}

export interface PainelPrefeitoData {
  municipio: string;
  uf: string;
  atualizado_em: string;
  kpis: PainelKpis;
  solicitacoes: SolicitacoesStats;
  secretarias: SecretariaResumo[];
  alertas: AlertaMunicipio[];
}

/** Cargo e escopo do usuário logado. */
export const getPainelContexto = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PainelContexto | null> => {
    const { data, error } = await (context.supabase as any).rpc("painel_meu_contexto");
    if (error) throw new Error(error.message);
    return (data as PainelContexto) ?? null;
  });

/** Indicadores de uma secretaria (padrão: a do usuário logado). */
export const getPainelSecretaria = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { secretariaId?: string | null } | undefined) => input ?? {})
  .handler(async ({ data, context }): Promise<PainelSecretariaData> => {
    const { data: result, error } = await (context.supabase as any).rpc("painel_secretaria", {
      _secretaria_id: data?.secretariaId ?? null,
    });
    if (error) throw new Error(error.message);
    return result as PainelSecretariaData;
  });

/** Indicadores agregados do município (apenas Prefeito). */
export const getPainelPrefeito = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PainelPrefeitoData> => {
    const { data, error } = await (context.supabase as any).rpc("painel_prefeito");
    if (error) throw new Error(error.message);
    return data as PainelPrefeitoData;
  });
