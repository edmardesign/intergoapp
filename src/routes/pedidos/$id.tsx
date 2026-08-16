import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, Loader2, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'
import { StatusSelo } from '@/components/pedidos/StatusSelo'
import { Timeline } from '@/components/pedidos/Timeline'
import { dataExtensa, getDiretorio, urlAssinada, type PessoaMin } from '@/lib/mensagens'
import {
  aprovar,
  encaminhar,
  entregar,
  getMeuContexto,
  getSolicitacao,
  listarAnexosDoPedido,
  listarEventos,
  negar,
  quantidadeFormatada,
  type MeuContexto,
  type Solicitacao,
  type SolicitacaoEvento,
} from '@/lib/pedidos'

export const Route = createFileRoute('/pedidos/$id')({
  head: () => ({
    meta: [
      { title: 'Detalhe do pedido | INTERGO' },
      {
        name: 'description',
        content:
          'Veja o pedido de material, a justificativa, os anexos e a linha do tempo completa de aprovações.',
      },
      { property: 'og:title', content: 'Detalhe do pedido | INTERGO' },
      {
        property: 'og:description',
        content: 'Linha do tempo do pedido de material: quem analisou, aprovou e entregou.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: PedidoDetalheComponent,
})

type AcaoSheet = 'aprovar' | 'negar' | 'entregar' | null

function PedidoDetalheComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const [carregando, setCarregando] = useState(true)
  const [pedido, setPedido] = useState<Solicitacao | null>(null)
  const [eventos, setEventos] = useState<SolicitacaoEvento[]>([])
  const [anexos, setAnexos] = useState<any[]>([])
  const [diretorio, setDiretorio] = useState<Map<string, PessoaMin>>(new Map())
  const [ctx, setCtx] = useState<MeuContexto | null>(null)
  const [sheet, setSheet] = useState<AcaoSheet>(null)
  const [obs, setObs] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      navigate({ to: '/login' })
      return
    }
    const [p, ev, an, dir, c] = await Promise.all([
      getSolicitacao(id),
      listarEventos(id),
      listarAnexosDoPedido(id),
      getDiretorio(),
      getMeuContexto(session.user.id),
    ])
    setPedido(p)
    setEventos(ev)
    setAnexos(an)
    setDiretorio(dir)
    setCtx(c)
  }, [id, navigate])

  useEffect(() => {
    carregar()
      .catch((err: any) => toast.error(err?.message ?? 'Não foi possível abrir o pedido.'))
      .finally(() => setCarregando(false))
  }, [carregar])

  const abrirAnexo = async (caminho: string) => {
    try {
      const url = await urlAssinada(caminho)
      window.open(url, '_blank', 'noopener')
    } catch {
      toast.error('Não foi possível abrir o anexo.')
    }
  }

  const executar = async (fn: () => Promise<void>, mensagem: string) => {
    setSalvando(true)
    try {
      await fn()
      setSheet(null)
      setObs('')
      await carregar()
      toast.success(mensagem)
    } catch (err: any) {
      toast.error(err?.message ?? 'Não foi possível concluir a ação.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen space-y-3 bg-background p-5">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="min-h-screen bg-background p-5">
        <p className="rounded-2xl bg-card p-4 text-[15px] text-secondary">Pedido não encontrado.</p>
      </div>
    )
  }

  const solicitante = diretorio.get(pedido.solicitante_id)
  const aberto = pedido.status !== 'negado' && pedido.status !== 'entregue'
  const souResponsavel = !!ctx && pedido.responsavel_atual_id === ctx.id
  const podeAgir = aberto && souResponsavel
  const jaAprovouAgora = eventos.some((e) => e.acao === 'aprovou' && e.autor_id === ctx?.id)
  const podeAprovar = podeAgir && pedido.status !== 'aprovado' && !jaAprovouAgora
  const podeEncaminhar = podeAgir && !!ctx?.superior_id
  const podeEntregar =
    podeAgir && pedido.status === 'aprovado' && (ctx!.isSecretario || ctx!.isPrefeito)

  const campo =
    'w-full rounded-xl bg-muted px-4 py-3 text-[16px] text-foreground outline-none resize-none'

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-5 pb-2 pt-6">
        <button
          type="button"
          onClick={() => navigate({ to: '/pedidos' })}
          className="mb-3 inline-flex items-center gap-1 text-[15px] text-primary"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
          Voltar
        </button>
        <h1 className="text-[26px] font-bold leading-tight text-foreground">
          {pedido.item} · {quantidadeFormatada(pedido.quantidade, pedido.unidade_medida)}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <StatusSelo status={pedido.status} />
          {pedido.urgencia === 'urgente' && (
            <span className="rounded-md bg-[#FF3B30] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Urgente
            </span>
          )}
        </div>
      </header>

      <main className="space-y-4 px-5 py-4">
        <section className="space-y-3 rounded-2xl bg-card p-4">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-secondary">
              Solicitante
            </p>
            <p className="text-[15px] text-foreground">
              {solicitante?.nome ?? 'Usuário'}
              {solicitante?.cargo ? ` · ${solicitante.cargo}` : ''}
              {solicitante?.unidade ? ` · ${solicitante.unidade}` : ''}
            </p>
          </div>

          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-secondary">
              Justificativa
            </p>
            <p className="whitespace-pre-wrap text-[15px] leading-[21px] text-foreground">
              {pedido.justificativa}
            </p>
          </div>

          {anexos.length > 0 && (
            <div>
              <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-secondary">
                Anexos
              </p>
              <div className="flex flex-wrap gap-2">
                {anexos.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => abrirAnexo(a.url)}
                    className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-[14px] text-foreground"
                  >
                    <Paperclip size={15} strokeWidth={1.5} className="text-secondary" />
                    <span className="max-w-[160px] truncate">{a.nome}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-[13px] text-secondary">Criado em {dataExtensa(pedido.created_at)}</p>
        </section>

        <section className="rounded-2xl bg-card p-4">
          <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-secondary">
            Linha do tempo
          </h2>
          <Timeline eventos={eventos} diretorio={diretorio} />
        </section>

        {podeAgir && (
          <section className="space-y-2 rounded-2xl bg-card p-4">
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-secondary">
              O que fazer?
            </h2>

            {podeAprovar && (
              <button
                type="button"
                onClick={() => setSheet('aprovar')}
                className="w-full rounded-xl bg-primary py-3 text-[15px] font-semibold text-primary-foreground"
              >
                Aprovar
              </button>
            )}

            {podeEncaminhar && (
              <button
                type="button"
                disabled={salvando}
                onClick={() =>
                  executar(
                    () => encaminhar(pedido, ctx!),
                    `Encaminhado para ${ctx?.superior?.nome ?? 'seu superior'}.`,
                  )
                }
                className="w-full rounded-xl bg-muted py-3 text-[15px] font-semibold text-foreground"
              >
                Encaminhar ao meu superior
              </button>
            )}

            {podeEntregar && (
              <button
                type="button"
                onClick={() => setSheet('entregar')}
                className="w-full rounded-xl bg-muted py-3 text-[15px] font-semibold text-foreground"
              >
                Marcar como entregue
              </button>
            )}

            <button
              type="button"
              onClick={() => setSheet('negar')}
              className="w-full rounded-xl bg-muted py-3 text-[15px] font-semibold text-[#FF3B30]"
            >
              Negar
            </button>
          </section>
        )}
      </main>

      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={() => setSheet(null)}>
          <div
            className="w-full rounded-t-3xl bg-background p-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 text-[20px] font-bold text-foreground">
              {sheet === 'aprovar' ? 'Aprovar pedido' : sheet === 'negar' ? 'Negar pedido' : 'Marcar como entregue'}
            </h3>

            <label className="mb-2 block text-[13px] font-semibold uppercase tracking-wide text-secondary">
              {sheet === 'negar' ? 'Motivo' : 'Observação (opcional)'}
            </label>
            <textarea
              rows={4}
              maxLength={sheet === 'negar' ? 300 : 200}
              className={campo}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder={sheet === 'negar' ? 'Explique o motivo da negativa.' : 'Se quiser, deixe uma observação.'}
            />
            <p className="mt-1 text-right text-[13px] text-secondary">
              {obs.length}/{sheet === 'negar' ? 300 : 200}
            </p>

            <button
              type="button"
              disabled={salvando || (sheet === 'negar' && obs.trim().length === 0)}
              onClick={() => {
                if (sheet === 'aprovar')
                  executar(() => aprovar(pedido, ctx!, obs), 'Pedido aprovado.')
                else if (sheet === 'negar') executar(() => negar(pedido, ctx!, obs), 'Pedido negado.')
                else executar(() => entregar(pedido, ctx!, obs), 'Pedido marcado como entregue.')
              }}
              className={cn(
                'mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[16px] font-semibold disabled:opacity-40',
                sheet === 'negar'
                  ? 'bg-[#FF3B30] text-white'
                  : 'bg-primary text-primary-foreground',
              )}
            >
              {salvando && <Loader2 size={18} className="animate-spin" />}
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setSheet(null)}
              className="mt-2 w-full rounded-xl py-3 text-[15px] font-medium text-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
