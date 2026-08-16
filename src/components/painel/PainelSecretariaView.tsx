import React from "react";
import { KpiCard } from "./KpiCard";
import { BarraCumprimento, corCumprimento } from "./BarraCumprimento";
import { TabelaMini } from "./TabelaMini";
import { Sparkline } from "./Sparkline";
import { EstadoVazio } from "./EstadoVazio";
import { CORES_STATUS, ROTULOS_STATUS, dataHoraBR, numeroBR, percentualBR } from "./formatadores";
import type { PainelSecretariaData, SolicitacaoCritica, UnidadeRanking } from "@/lib/painel.functions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export interface PainelSecretariaViewProps {
  dados: PainelSecretariaData;
}

/** Layout vertical do painel de uma secretaria — usado pelo Secretário e, em leitura, pelo Prefeito. */
export const PainelSecretariaView: React.FC<PainelSecretariaViewProps> = ({ dados }) => {
  const [verUnidades, setVerUnidades] = React.useState(false);

  const { kpis, solicitacoes, unidades, sparkline } = dados;
  const statusChaves = ["solicitado", "em_analise", "aprovado", "negado", "entregue"];
  const totalSolic = statusChaves.reduce((acc, k) => acc + (solicitacoes?.por_status?.[k] ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Seção 2 — KPIs */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          titulo="Ativos na secretaria"
          valor={numeroBR(kpis.ativos)}
          subrotulo={`+${numeroBR(kpis.novos_28d)} nas últimas 4 semanas`}
        />
        <KpiCard titulo="Cadastros pendentes" valor={numeroBR(kpis.pendentes)} />
        <KpiCard
          titulo="Taxa de confirmação (7d)"
          valor={percentualBR(kpis.confirmacao_pct)}
          subrotulo={
            kpis.confirmacao_total === 0
              ? "Sem mensagens com confirmação"
              : `${numeroBR(kpis.confirmacao_ok)} de ${numeroBR(kpis.confirmacao_total)}`
          }
        >
          <BarraCumprimento percentual={kpis.confirmacao_pct ?? 0} />
        </KpiCard>
        <KpiCard titulo="Solicitações abertas" valor={numeroBR(solicitacoes?.abertas ?? 0)} />
      </section>

      {/* Seção 3 — Solicitações por status */}
      <section className="rounded-2xl bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h2 className="mb-3 text-[17px] font-semibold text-foreground">Solicitações por status</h2>
        {totalSolic === 0 ? (
          <p className="text-[13px] leading-[18px] text-muted-foreground">
            Nenhuma solicitação registrada até agora.
          </p>
        ) : (
          <div className="space-y-3">
            {statusChaves.map((chave) => {
              const valor = solicitacoes?.por_status?.[chave] ?? 0;
              const pct = totalSolic === 0 ? 0 : Math.round((valor / totalSolic) * 100);
              return (
                <div key={chave}>
                  <div className="mb-1 flex items-center justify-between text-[13px] leading-[18px]">
                    <span className="text-foreground">{ROTULOS_STATUS[chave]}</span>
                    <span className="text-muted-foreground">
                      {numeroBR(valor)} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-[4px] bg-[#E5E5EA]">
                    <div
                      className="h-full rounded-[4px] transition-[width] duration-500"
                      style={{ width: `${pct}%`, backgroundColor: CORES_STATUS[chave] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Seção 4 — Solicitações críticas */}
      <section className="rounded-2xl bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h2 className="mb-1 text-[17px] font-semibold text-foreground">Solicitações críticas</h2>
        <p className="mb-2 text-[13px] leading-[18px] text-muted-foreground">
          Abertas há mais de 3 dias.
        </p>
        <TabelaMini<SolicitacaoCritica>
          colunas={[
            { chave: "item", titulo: "Item", render: (l) => l.item },
            { chave: "solicitante", titulo: "Solicitante", render: (l) => l.solicitante ?? "—" },
            { chave: "dias", titulo: "Dias parado", alinhar: "right", render: (l) => numeroBR(l.dias) },
            { chave: "resp", titulo: "Responsável", render: (l) => l.responsavel ?? "—" },
          ]}
          linhas={solicitacoes?.top_criticas ?? []}
          chaveLinha={(l) => l.id}
          destacar={(l) => l.dias > 7}
          vazio="Nenhuma solicitação parada por mais de 3 dias."
        />
      </section>

      {/* Seção 5 — Ranking de confirmação por unidade */}
      <section className="rounded-2xl bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h2 className="mb-3 text-[17px] font-semibold text-foreground">
          Confirmação por unidade (7d)
        </h2>
        {unidades.length === 0 ? (
          <EstadoVazio mensagem="Ainda não temos dados suficientes para calcular esta métrica — volte após enviar algumas mensagens." />
        ) : (
          <>
            <ul className="space-y-3">
              {unidades.slice(0, 5).map((u) => (
                <LinhaUnidade key={u.id} unidade={u} />
              ))}
            </ul>
            {unidades.length > 5 && (
              <button
                type="button"
                onClick={() => setVerUnidades(true)}
                className="mt-3 text-[15px] font-medium text-primary"
              >
                Ver todas
              </button>
            )}
          </>
        )}
      </section>

      {/* Seção 6 — Mensagens enviadas */}
      <section className="rounded-2xl bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h2 className="text-[17px] font-semibold text-foreground">Mensagens enviadas (30 dias)</h2>
        <p className="mt-1 text-[28px] font-bold leading-[34px] text-foreground">
          {numeroBR(kpis.mensagens_30d)}
        </p>
        <div className="mt-3">
          <Sparkline valores={(sparkline ?? []).map((s) => s.total)} />
        </div>
        <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
          Por semana · atualizado em {dataHoraBR(dados.atualizado_em)}
        </p>
      </section>

      <Sheet open={verUnidades} onOpenChange={setVerUnidades}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Confirmação por unidade</SheetTitle>
          </SheetHeader>
          <ul className="mt-4 space-y-3 pb-6">
            {unidades.map((u) => (
              <LinhaUnidade key={u.id} unidade={u} />
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const LinhaUnidade: React.FC<{ unidade: UnidadeRanking }> = ({ unidade }) => (
  <li>
    <div className="mb-1 flex items-center justify-between text-[15px] leading-5">
      <span className="text-foreground">{unidade.nome}</span>
      <span className="font-medium" style={{ color: corCumprimento(unidade.percentual) }}>
        {unidade.total === 0 ? "—" : percentualBR(unidade.percentual)}
      </span>
    </div>
    <BarraCumprimento percentual={unidade.percentual} />
  </li>
);
