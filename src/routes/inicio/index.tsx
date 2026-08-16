import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, ChevronRight, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { MensagemCard } from '@/components/mensagens/MensagemCard'
import {
  assinarMensagens,
  chaveDia,
  confirmarRecebimento,
  getDiretorio,
  hojeChave,
  listarRecebidas,
  rotuloDia,
  type MensagemRecebida,
  type PessoaMin,
} from '@/lib/mensagens'

type Filtro = 'todas' | 'urgentes'

export const Route = createFileRoute('/inicio/')({
  validateSearch: (search: Record<string, unknown>): { filtro?: Filtro | undefined } => ({
    filtro: search['filtro'] === 'urgentes' ? 'urgentes' : undefined,
  }),
  component: InicioComponent,
})

const LOTE = 20

function SecaoTitulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-secondary">
      {children}
    </h2>
  )
}

function Vazio({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-card p-4 text-[15px] leading-[20px] text-secondary">{texto}</div>
  )
}

function InicioComponent() {
  const navigate = useNavigate()
  const { filtro } = Route.useSearch()

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [temEquipe, setTemEquipe] = useState(false)
  const [cadastrosPendentes, setCadastrosPendentes] = useState(0)
  const [naoConfirmaram, setNaoConfirmaram] = useState(0)

  const [itens, setItens] = useState<MensagemRecebida[]>([])
  const [diretorio, setDiretorio] = useState<Map<string, PessoaMin>>(new Map())
  const [offset, setOffset] = useState(0)
  const [temMais, setTemMais] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [saindo, setSaindo] = useState<Set<string>>(new Set())

  const sentinela = useRef<HTMLDivElement | null>(null)

  /* --------------------------- carregamento --------------------------- */

  const carregarPendencias = useCallback(async (uid: string) => {
    const { count } = await supabase
      .from('perfis')
      .select('*', { count: 'exact', head: true })
      .eq('superior_id', uid)
      .eq('status', 'pendente')
    setCadastrosPendentes(count ?? 0)

    const { data: minhas } = await (supabase as any)
      .from('mensagens')
      .select('id')
      .eq('remetente_id', uid)
      .eq('exigir_confirmacao', true)

    const ids = (minhas ?? []).map((m: any) => m.id)
    if (ids.length) {
      const { count: pend } = await (supabase as any)
        .from('mensagem_destinatarios')
        .select('*', { count: 'exact', head: true })
        .in('mensagem_id', ids)
        .is('confirmado_em', null)
      setNaoConfirmaram(pend ?? 0)
    } else {
      setNaoConfirmaram(0)
    }
  }, [])

  const carregarFeed = useCallback(async (uid: string) => {
    const primeiros = await listarRecebidas(uid, 0, LOTE)
    setItens(primeiros)
    setOffset(primeiros.length)
    setTemMais(primeiros.length === LOTE)
  }, [])

  useEffect(() => {
    let limpar: (() => void) | undefined

    const iniciar = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        navigate({ to: '/login' })
        return
      }
      const uid = session.user.id

      const { data: profile } = await supabase
        .from('perfis')
        .select('status, nivel:nivel_id(nome)')
        .eq('id', uid)
        .single()

      if (!profile || profile.status !== 'ativo') {
        navigate({ to: '/' })
        return
      }

      const cargo = ((profile as any).nivel?.nome ?? '').toLowerCase()
      setTemEquipe(!cargo.includes('professor'))
      setUserId(uid)

      try {
        const [dir] = await Promise.all([getDiretorio(), carregarFeed(uid), carregarPendencias(uid)])
        setDiretorio(dir)
      } catch (e: any) {
        toast.error('Não foi possível carregar suas mensagens.')
      }
      setLoading(false)

      limpar = assinarMensagens(uid, () => {
        carregarFeed(uid).catch(() => {})
        carregarPendencias(uid).catch(() => {})
      })
    }

    iniciar()
    return () => limpar?.()
  }, [navigate, carregarFeed, carregarPendencias])

  /* --------------------------- rolagem infinita --------------------------- */

  const carregarMais = useCallback(async () => {
    if (!userId || carregandoMais || !temMais) return
    setCarregandoMais(true)
    try {
      const novos = await listarRecebidas(userId, offset, LOTE)
      setItens((prev) => {
        const vistos = new Set(prev.map((i) => i.mensagem.id))
        return [...prev, ...novos.filter((n) => !vistos.has(n.mensagem.id))]
      })
      setOffset((o) => o + novos.length)
      setTemMais(novos.length === LOTE)
    } catch {
      setTemMais(false)
    }
    setCarregandoMais(false)
  }, [userId, offset, temMais, carregandoMais])

  useEffect(() => {
    const el = sentinela.current
    if (!el || !temMais) return
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) carregarMais()
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [carregarMais, temMais])

  /* --------------------------- ações --------------------------- */

  const confirmar = async (mensagemId: string) => {
    if (!userId) return
    setSaindo((s: Set<string>) => new Set(s).add(mensagemId))
    const agora = new Date().toISOString()
    const anterior = itens
    setTimeout(() => {
      setItens((prev) =>
        prev.map((i) =>
          i.mensagem.id === mensagemId ? { ...i, confirmado_em: agora, lido_em: i.lido_em ?? agora } : i,
        ),
      )
      setSaindo((s: Set<string>) => {
        const n = new Set(s)
        n.delete(mensagemId)
        return n
      })
    }, 250)

    try {
      await confirmarRecebimento(mensagemId, userId)
    } catch {
      setItens(anterior)
      toast.error('Não foi possível confirmar. Tente novamente.')
    }
  }

  const abrir = (mensagemId: string) => {
    navigate({ to: '/inicio/msg/$id', params: { id: mensagemId } })
  }

  /* --------------------------- derivados --------------------------- */

  const aguardando = useMemo(() => {
    const lista = itens.filter((i) => i.mensagem.exigir_confirmacao && !i.confirmado_em)
    return lista.sort((a, b) => {
      if (a.mensagem.urgente !== b.mensagem.urgente) return a.mensagem.urgente ? -1 : 1
      return new Date(b.mensagem.created_at).getTime() - new Date(a.mensagem.created_at).getTime()
    })
  }, [itens])

  const urgentesPendentes = useMemo(
    () => aguardando.filter((i) => i.mensagem.urgente),
    [aguardando],
  )

  const hoje = hojeChave()

  const recebidasHoje = useMemo(
    () =>
      itens.filter(
        (i) =>
          chaveDia(i.mensagem.created_at) === hoje &&
          !(i.mensagem.exigir_confirmacao && !i.confirmado_em),
      ),
    [itens, hoje],
  )

  const anteriores = useMemo(() => {
    const grupos = new Map<string, MensagemRecebida[]>()
    for (const i of itens) {
      const chave = chaveDia(i.mensagem.created_at)
      if (chave === hoje) continue
      const lista = grupos.get(chave) ?? []
      lista.push(i)
      grupos.set(chave, lista)
    }
    return [...grupos.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [itens, hoje])

  const visiveisUrgentes = filtro === 'urgentes'

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-6">
      <header className="mb-5 flex items-baseline justify-between">
        <h1 className="text-[28px] leading-[34px] font-bold text-foreground">Início</h1>
        {visiveisUrgentes && (
          <Link to="/inicio" search={{}} className="text-[13px] font-medium text-primary">
            Ver todas
          </Link>
        )}
      </header>

      {temEquipe && (
        <>
          {(cadastrosPendentes > 0 || naoConfirmaram > 0) && (
            <section className="mb-5 overflow-hidden rounded-2xl bg-card">
              <div className="px-4 pt-4 text-[13px] font-semibold uppercase tracking-wide text-secondary">
                Pendências da sua equipe
              </div>
              <div className="mt-2">
                {cadastrosPendentes > 0 && (
                  <Link
                    to="/equipe"
                    search={{ aba: 'pendentes' }}
                    className="flex items-center justify-between px-4 py-3 active:bg-accent"
                  >
                    <span className="text-[15px] leading-[20px] font-medium text-foreground">
                      {cadastrosPendentes} cadastro{cadastrosPendentes > 1 ? 's' : ''} aguardando
                      aprovação
                    </span>
                    <ChevronRight size={18} style={{ color: '#AEAEB2' }} />
                  </Link>
                )}
                {naoConfirmaram > 0 && (
                  <Link
                    to="/enviadas"
                    className="flex items-center justify-between px-4 py-3 active:bg-accent"
                  >
                    <span className="text-[15px] leading-[20px] font-medium text-foreground">
                      {naoConfirmaram} pessoa{naoConfirmaram > 1 ? 's' : ''} ainda não confirmaram
                    </span>
                    <ChevronRight size={18} style={{ color: '#AEAEB2' }} />
                  </Link>
                )}
              </div>
            </section>
          )}

          <Link
            to="/enviadas"
            className="mb-5 block text-[13px] font-medium text-primary active:opacity-60"
          >
            Ver mensagens que eu enviei →
          </Link>
        </>
      )}

      {urgentesPendentes.length > 0 && !visiveisUrgentes && (
        <Link
          to="/inicio"
          search={{ filtro: 'urgentes' }}
          className="mb-5 flex items-center gap-2 rounded-xl p-4"
          style={{ backgroundColor: '#FFEBEA', borderLeft: '4px solid #C1272D' }}
        >
          <AlertTriangle size={18} style={{ color: '#C1272D' }} />
          <span className="text-[15px] leading-[20px] font-semibold" style={{ color: '#C1272D' }}>
            Você tem {urgentesPendentes.length} mensagem
            {urgentesPendentes.length > 1 ? 's urgentes aguardando' : ' urgente aguardando'}{' '}
            confirmação.
          </span>
        </Link>
      )}

      <section className="mb-6">
        <SecaoTitulo>Precisa da sua confirmação</SecaoTitulo>
        <div className="space-y-3">
          {(visiveisUrgentes ? urgentesPendentes : aguardando).length === 0 ? (
            <Vazio texto="Você está em dia — nada aguardando confirmação." />
          ) : (
            (visiveisUrgentes ? urgentesPendentes : aguardando).map((i) => (
              <MensagemCard
                key={i.mensagem.id}
                mensagem={i.mensagem}
                remetente={diretorio.get(i.mensagem.remetente_id)}
                saindo={saindo.has(i.mensagem.id)}
                onClick={() => abrir(i.mensagem.id)}
                onConfirmar={() => confirmar(i.mensagem.id)}
              />
            ))
          )}
        </div>
      </section>

      {!visiveisUrgentes && (
        <>
          <section className="mb-6">
            <SecaoTitulo>Recebidas hoje</SecaoTitulo>
            <div className="space-y-3">
              {recebidasHoje.length === 0 ? (
                <Vazio texto="Nenhuma mensagem hoje." />
              ) : (
                recebidasHoje.map((i) => (
                  <MensagemCard
                    key={i.mensagem.id}
                    mensagem={i.mensagem}
                    remetente={diretorio.get(i.mensagem.remetente_id)}
                    naoLida={!i.lido_em}
                    onClick={() => abrir(i.mensagem.id)}
                  />
                ))
              )}
            </div>
          </section>

          <section>
            <SecaoTitulo>Anteriores</SecaoTitulo>
            {anteriores.length === 0 ? (
              <Vazio texto="Sem histórico." />
            ) : (
              <div className="space-y-6">
                {anteriores.map(([chave, lista]) => (
                  <div key={chave}>
                    <p className="mb-2 text-[13px] font-medium text-secondary">{rotuloDia(chave)}</p>
                    <div className="space-y-3">
                      {lista.map((i) => (
                        <MensagemCard
                          key={i.mensagem.id}
                          mensagem={i.mensagem}
                          remetente={diretorio.get(i.mensagem.remetente_id)}
                          naoLida={!i.lido_em}
                          onClick={() => abrir(i.mensagem.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div ref={sentinela} className="h-8" />
            {carregandoMais && (
              <div className="space-y-3">
                {[0, 1].map((k) => (
                  <div key={k} className="h-24 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
