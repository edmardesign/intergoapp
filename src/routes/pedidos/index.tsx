import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'
import { PedidoCard } from '@/components/pedidos/PedidoCard'
import { getDiretorio, type PessoaMin } from '@/lib/mensagens'
import {
  assinarPedidos,
  getMeuContexto,
  listarHistorico,
  listarMinhas,
  listarParaAnalisar,
  type MeuContexto,
  type Solicitacao,
} from '@/lib/pedidos'

type Aba = 'minhas' | 'analisar' | 'historico'

export const Route = createFileRoute('/pedidos/')({
  head: () => ({
    meta: [
      { title: 'Pedidos de material | INTERGO' },
      {
        name: 'description',
        content:
          'Acompanhe pedidos de material que sobem pela hierarquia: crie, analise e entregue solicitações da sua equipe.',
      },
      { property: 'og:title', content: 'Pedidos de material | INTERGO' },
      {
        property: 'og:description',
        content: 'Crie, analise e acompanhe pedidos de material da sua equipe no INTERGO.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: PedidosComponent,
})

const LOTE = 20

function Skeletons() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  )
}

function PedidosComponent() {
  const navigate = useNavigate()
  const [aba, setAba] = useState<Aba>('minhas')
  const [carregando, setCarregando] = useState(true)
  const [ctx, setCtx] = useState<MeuContexto | null>(null)
  const [diretorio, setDiretorio] = useState<Map<string, PessoaMin>>(new Map())
  const [minhas, setMinhas] = useState<Solicitacao[]>([])
  const [analisar, setAnalisar] = useState<Solicitacao[]>([])
  const [historico, setHistorico] = useState<Solicitacao[]>([])
  const [temMais, setTemMais] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const userIdRef = useRef<string | null>(null)

  const carregar = useCallback(async (userId: string) => {
    const [dir, ctxAtual, a, b, c] = await Promise.all([
      getDiretorio(),
      getMeuContexto(userId),
      listarMinhas(userId),
      listarParaAnalisar(userId),
      listarHistorico(userId, 0, LOTE),
    ])
    setDiretorio(dir)
    setCtx(ctxAtual)
    setMinhas(a)
    setAnalisar(b)
    setHistorico(c)
    setTemMais(c.length === LOTE)
  }, [])

  useEffect(() => {
    let limpar: (() => void) | undefined
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        navigate({ to: '/login' })
        return
      }
      const userId = session.user.id
      userIdRef.current = userId
      try {
        await carregar(userId)
      } catch (err: any) {
        toast.error(err?.message ?? 'Não foi possível carregar os pedidos.')
      } finally {
        setCarregando(false)
      }

      limpar = assinarPedidos(userId, (row) => {
        carregar(userId).catch(() => undefined)
        if (row.solicitante_id === userId && row.responsavel_atual_id !== userId) {
          const quem = diretorio.get(row.responsavel_atual_id)?.nome
          if (row.status === 'negado') toast(`Seu pedido de ${row.item} foi negado.`)
          else if (row.status === 'aprovado') toast(`Seu pedido de ${row.item} foi aprovado.`)
          else if (row.status === 'entregue') toast(`Seu pedido de ${row.item} foi entregue.`)
          else if (quem) toast(`Seu pedido de ${row.item} foi encaminhado para ${quem}.`)
        }
      })
    })()
    return () => limpar?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregar])

  const carregarMais = async () => {
    const userId = userIdRef.current
    if (!userId || carregandoMais || !temMais) return
    setCarregandoMais(true)
    try {
      const novos = await listarHistorico(userId, historico.length, LOTE)
      setHistorico((h) => [...h, ...novos])
      setTemMais(novos.length === LOTE)
    } finally {
      setCarregandoMais(false)
    }
  }

  const abas: { chave: Aba; rotulo: string; contador?: number }[] = [
    { chave: 'minhas', rotulo: 'Minhas' },
    { chave: 'analisar', rotulo: 'Para analisar', contador: analisar.length },
    { chave: 'historico', rotulo: 'Histórico' },
  ]

  const lista = aba === 'minhas' ? minhas : aba === 'analisar' ? analisar : historico

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-5 pb-3 pt-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[28px] font-bold leading-tight text-foreground">Pedidos</h1>
          {ctx?.podeCriar ? (
            <Link
              to="/pedidos/novo"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[14px] font-semibold text-primary-foreground"
            >
              <Plus size={16} strokeWidth={2} />
              Novo pedido
            </Link>
          ) : (
            ctx && (
              <span
                className="text-[13px] text-secondary"
                title="Prefeito não solicita — recebe"
              >
                Prefeito não solicita — recebe
              </span>
            )
          )}
        </div>
      </header>

      <div className="px-5">
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {abas.map((a) => (
            <button
              key={a.chave}
              type="button"
              onClick={() => setAba(a.chave)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-medium transition-colors',
                aba === a.chave ? 'bg-card text-foreground shadow-sm' : 'text-secondary',
              )}
            >
              {a.rotulo}
              {!!a.contador && (
                <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                  {a.contador}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="space-y-3 px-5 py-4">
        {carregando ? (
          <Skeletons />
        ) : lista.length === 0 ? (
          <div className="rounded-2xl bg-card p-4 text-[15px] leading-[20px] text-secondary">
            {aba === 'analisar'
              ? 'Nenhum pedido esperando você agora.'
              : aba === 'minhas'
                ? 'Você ainda não fez nenhum pedido.'
                : 'Nada finalizado por aqui ainda.'}
          </div>
        ) : (
          <>
            {lista.map((p) => (
              <PedidoCard
                key={p.id}
                pedido={p}
                solicitante={diretorio.get(p.solicitante_id)}
                responsavel={
                  p.responsavel_atual_id ? diretorio.get(p.responsavel_atual_id) : undefined
                }
                mostrarResponsavel={aba === 'minhas'}
              />
            ))}

            {aba === 'historico' && temMais && (
              <button
                type="button"
                onClick={carregarMais}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-card py-3 text-[14px] font-medium text-secondary"
              >
                {carregandoMais && <Loader2 size={16} className="animate-spin" />}
                Carregar mais
              </button>
            )}
          </>
        )}
      </main>
    </div>
  )
}
