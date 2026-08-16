import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  getPainelContexto,
  getPainelPrefeito,
  getPainelSecretaria,
  type SecretariaResumo,
} from "@/lib/painel.functions";
import { PainelHeader } from "@/components/painel/PainelHeader";
import { PainelSecretariaView } from "@/components/painel/PainelSecretariaView";
import { KpiCard } from "@/components/painel/KpiCard";
import { BarraCumprimento } from "@/components/painel/BarraCumprimento";
import { TabelaMini } from "@/components/painel/TabelaMini";
import { EstadoVazio } from "@/components/painel/EstadoVazio";
import { numeroBR, percentualBR } from "@/components/painel/formatadores";
import { cn } from "@/lib/utils";

const STALE_MS = 60_000;

export const Route = createFileRoute("/painel/")({
  ssr: false,
  component: PainelPage,
  errorComponent: ({ error }) => (
    <div className="p-4 pt-12" role="alert">
      <p className="text-[15px] text-[#FF3B30]">Não foi possível carregar o painel: {error.message}</p>
    </div>
  ),
  notFoundComponent: () => <div className="p-4 pt-12">Painel não encontrado.</div>,
});

function PainelPage() {
  const navigate = useNavigate();
  const fetchContexto = useServerFn(getPainelContexto);
  const fetchPrefeito = useServerFn(getPainelPrefeito);
  const fetchSecretaria = useServerFn(getPainelSecretaria);

  const contextoQuery = useQuery({
    queryKey: ["painel", "contexto"],
    queryFn: () => fetchContexto(),
    staleTime: STALE_MS,
  });

  const contexto = contextoQuery.data;
  const isPrefeito = !!contexto?.is_prefeito;
  const podeVer = isPrefeito || !!contexto?.is_secretario;

  const prefeitoQuery = useQuery({
    queryKey: ["painel", "prefeito"],
    queryFn: () => fetchPrefeito(),
    enabled: isPrefeito,
    staleTime: STALE_MS,
  });

  const secretariaQuery = useQuery({
    queryKey: ["painel", "secretaria", contexto?.secretaria_id ?? null],
    queryFn: () => fetchSecretaria({ data: {} }),
    enabled: !!contexto && !isPrefeito && !!contexto.is_secretario,
    staleTime: STALE_MS,
  });

  if (contextoQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  // Validação no cliente antes de renderizar (o RLS/RPC já protege no servidor).
  if (!podeVer) {
    return (
      <div className="min-h-screen bg-background p-4 pt-12 pb-20">
        <h1 className="text-[28px] font-bold leading-[34px] text-foreground">Painel</h1>
        <p className="mt-2 text-[15px] leading-5 text-muted-foreground">
          O painel de indicadores está disponível apenas para Secretário e Prefeito.
        </p>
      </div>
    );
  }

  if (isPrefeito) {
    const dados = prefeitoQuery.data;
    return (
      <div className="min-h-screen bg-background p-4 pt-12 pb-24">
        {prefeitoQuery.isLoading || !dados ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : (
          <>
            <PainelHeader
              titulo={`Painel · ${dados.municipio}`}
              subtitulo={`${dados.uf} · ${numeroBR(dados.secretarias.length)} secretarias ativas`}
              atualizadoEm={dados.atualizado_em}
              atualizando={prefeitoQuery.isFetching}
              onAtualizar={() => prefeitoQuery.refetch()}
            />

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard
                titulo="Ativos no município"
                valor={numeroBR(dados.kpis.ativos)}
                subrotulo={`+${numeroBR(dados.kpis.novos_28d)} nas últimas 4 semanas`}
              />
              <KpiCard titulo="Cadastros pendentes" valor={numeroBR(dados.kpis.pendentes)} />
              <KpiCard
                titulo="Taxa de confirmação (7d)"
                valor={percentualBR(dados.kpis.confirmacao_pct)}
                subrotulo={
                  dados.kpis.confirmacao_total === 0
                    ? "Sem mensagens com confirmação"
                    : `${numeroBR(dados.kpis.confirmacao_ok)} de ${numeroBR(dados.kpis.confirmacao_total)}`
                }
              >
                <BarraCumprimento percentual={dados.kpis.confirmacao_pct ?? 0} />
              </KpiCard>
              <KpiCard titulo="Solicitações abertas" valor={numeroBR(dados.solicitacoes?.abertas ?? 0)} />
            </section>

            {/* Grade de secretarias */}
            <section className="mt-6">
              <h2 className="mb-3 text-[17px] font-semibold text-foreground">Secretarias</h2>
              {dados.secretarias.length === 0 ? (
                <EstadoVazio mensagem="Nenhuma secretaria cadastrada neste município ainda." />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dados.secretarias.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        navigate({ to: "/painel/secretaria/$id", params: { id: s.id } })
                      }
                      className="rounded-2xl bg-card p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-transform duration-200 active:scale-[0.98]"
                    >
                      <p className="text-[17px] font-semibold text-foreground">{s.nome}</p>
                      <p className="mt-2 text-[28px] font-bold leading-[34px] text-foreground">
                        {numeroBR(s.ativos)}
                      </p>
                      <p className="text-[13px] leading-[18px] text-muted-foreground">ativos</p>
                      <div className="mt-3">
                        <BarraCumprimento percentual={s.confirmacao_pct ?? 0} />
                        <p className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
                          Confirmação 7d: {percentualBR(s.confirmacao_pct)}
                        </p>
                      </div>
                      <p className="mt-2 text-[13px] leading-[18px] text-muted-foreground">
                        {numeroBR(s.solicitacoes_abertas)} solicitações abertas
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Comparativo */}
            <section className="mt-6 rounded-2xl bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              <h2 className="mb-2 text-[17px] font-semibold text-foreground">Comparativo</h2>
              <TabelaMini<SecretariaResumo>
                colunas={[
                  {
                    chave: "nome",
                    titulo: "Secretaria",
                    render: (l) => l.nome,
                    ordenavel: true,
                    valorOrdenacao: (l) => l.nome,
                  },
                  {
                    chave: "ativos",
                    titulo: "Ativos",
                    alinhar: "right",
                    render: (l) => numeroBR(l.ativos),
                    ordenavel: true,
                    valorOrdenacao: (l) => l.ativos,
                  },
                  {
                    chave: "pendentes",
                    titulo: "Pend.",
                    alinhar: "right",
                    render: (l) => numeroBR(l.pendentes),
                    ordenavel: true,
                    valorOrdenacao: (l) => l.pendentes,
                  },
                  {
                    chave: "conf",
                    titulo: "Confirm.",
                    alinhar: "right",
                    render: (l) => percentualBR(l.confirmacao_pct),
                    ordenavel: true,
                    valorOrdenacao: (l) => l.confirmacao_pct ?? -1,
                  },
                  {
                    chave: "abertas",
                    titulo: "Abertas",
                    alinhar: "right",
                    render: (l) => numeroBR(l.solicitacoes_abertas),
                    ordenavel: true,
                    valorOrdenacao: (l) => l.solicitacoes_abertas,
                  },
                  {
                    chave: "criticas",
                    titulo: "Críticas",
                    alinhar: "right",
                    render: (l) => numeroBR(l.solicitacoes_criticas),
                    ordenavel: true,
                    valorOrdenacao: (l) => l.solicitacoes_criticas,
                  },
                ]}
                linhas={dados.secretarias}
                chaveLinha={(l) => l.id}
                limite={dados.secretarias.length}
                vazio="Sem secretarias para comparar."
                rodape={
                  <tr>
                    <td className="py-2 text-[13px] font-semibold uppercase text-muted-foreground">
                      Total
                    </td>
                    <td className="py-2 text-right text-[15px] font-semibold">
                      {numeroBR(dados.kpis.ativos)}
                    </td>
                    <td className="py-2 text-right text-[15px] font-semibold">
                      {numeroBR(dados.kpis.pendentes)}
                    </td>
                    <td className="py-2 text-right text-[15px] font-semibold">
                      {percentualBR(dados.kpis.confirmacao_pct)}
                    </td>
                    <td className="py-2 text-right text-[15px] font-semibold">
                      {numeroBR(dados.solicitacoes?.abertas ?? 0)}
                    </td>
                    <td className="py-2 text-right text-[15px] font-semibold">
                      {numeroBR(dados.solicitacoes?.criticas ?? 0)}
                    </td>
                  </tr>
                }
              />
            </section>

            {/* Alertas */}
            <section className="mt-6">
              <h2 className="mb-3 text-[17px] font-semibold text-foreground">Alertas do município</h2>
              {dados.alertas.length === 0 ? (
                <EstadoVazio mensagem="Nenhum alerta no momento. Tudo em dia." />
              ) : (
                <ul className="space-y-2">
                  {dados.alertas.map((a, i) => (
                    <li
                      key={`${a.tipo}-${i}`}
                      className="flex items-start gap-3 rounded-2xl bg-card p-3 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    >
                      <AlertTriangle
                        size={20}
                        strokeWidth={1.5}
                        className={cn(a.severidade === "alta" ? "text-[#FF3B30]" : "text-[#FF9F0A]")}
                      />
                      <div className="min-w-0">
                        <p className="text-[15px] leading-5 text-foreground">{a.titulo}</p>
                        <p className="text-[13px] leading-[18px] text-muted-foreground">{a.detalhe}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    );
  }

  // Secretário
  const dados = secretariaQuery.data;
  return (
    <div className="min-h-screen bg-background p-4 pt-12 pb-24">
      {secretariaQuery.isLoading || !dados ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : (
        <>
          <PainelHeader
            titulo={`Painel · ${dados.secretaria.nome}`}
            subtitulo={`${dados.municipio} · ${dados.uf}`}
            atualizadoEm={dados.atualizado_em}
            atualizando={secretariaQuery.isFetching}
            onAtualizar={() => secretariaQuery.refetch()}
          />
          <PainelSecretariaView dados={dados} />
        </>
      )}
    </div>
  );
}
