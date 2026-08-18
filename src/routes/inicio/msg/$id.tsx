import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, CalendarDays, Clock, MapPin, Paperclip, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { TipoBadge } from '@/components/mensagens/TipoBadge'
import {
  assuntoDe,
  baixarICS,
  confirmarRecebimento,
  corpoDe,
  dataExtensa,
  diasAte,
  getAnexos,
  getDiretorio,
  getMensagem,
  getRecebida,
  marcarComoLida,
  urlAssinada,
  type Mensagem,
  type MensagemRecebida,
  type PessoaMin,
} from '@/lib/mensagens'

export const Route = createFileRoute('/inicio/msg/$id')({
  component: DetalheMensagem,
})

function tamanhoLegivel(bytes: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DetalheMensagem() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)
  const [recebida, setRecebida] = useState<MensagemRecebida | null>(null)
  const [remetente, setRemetente] = useState<PessoaMin | null>(null)
  const [anexos, setAnexos] = useState<any[]>([])
  const [confirmando, setConfirmando] = useState(false)

  useEffect(() => {
    const carregar = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        navigate({ to: '/login' })
        return
      }
      const uid = session.user.id
      setUserId(uid)

      try {
        const [msg, rec, dir, anx] = await Promise.all([
          getMensagem(id),
          getRecebida(uid, id),
          getDiretorio(),
          getAnexos(id),
        ])
        setMensagem(msg)
        setRecebida(rec)
        setAnexos(anx)
        if (msg) setRemetente(dir.get(msg.remetente_id) ?? null)
        if (rec && !rec.lido_em) {
          marcarComoLida(id, uid).catch(() => {})
          setRecebida({ ...rec, lido_em: new Date().toISOString() })
        }
      } catch {
        toast.error('Não foi possível abrir a mensagem.')
      }
      setLoading(false)
    }
    carregar()
  }, [id, navigate])

  const confirmar = async () => {
    if (!userId || !recebida) return
    const anterior = recebida
    setConfirmando(true)
    setRecebida({ ...recebida, confirmado_em: new Date().toISOString() })
    try {
      await confirmarRecebimento(id, userId)
      toast.success('Recebimento confirmado.')
    } catch {
      setRecebida(anterior)
      toast.error('Não foi possível confirmar. Tente novamente.')
    }
    setConfirmando(false)
  }

  const abrirAnexo = async (url: string) => {
    const assinada = await urlAssinada(url)
    window.open(assinada, '_blank', 'noopener')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  if (!mensagem) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-[15px] text-secondary">Mensagem não encontrada.</p>
      </div>
    )
  }

  const p = mensagem.payload ?? {}
  const prazoDias = mensagem.tipo === 'demanda' ? diasAte(p.prazo) : null
  const precisaConfirmar = mensagem.exigir_confirmacao && recebida && !recebida.confirmado_em

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-background/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate({ to: '/inicio', search: {} })}
          className="flex items-center gap-1 text-[15px] font-medium text-primary active:opacity-60"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>
        <TipoBadge tipo={mensagem.tipo} />
      </header>

      <div className="px-4">
        <h1 className="text-[28px] leading-[34px] font-bold text-foreground">
          {assuntoDe(mensagem)}
        </h1>

        <p className="mt-2 text-[13px] leading-[18px] text-secondary">
          {remetente?.nome ?? 'Remetente'}
          {remetente?.cargo ? ` · ${remetente.cargo}` : ''}
          {remetente?.unidade ? ` · ${remetente.unidade}` : ''}
        </p>
        <p className="text-[13px] leading-[18px] text-secondary">
          {dataExtensa(mensagem.created_at)}
        </p>

        {prazoDias !== null && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-card p-4">
            <Clock size={18} style={{ color: prazoDias <= 3 ? '#C1272D' : '#6E6E73' }} />
            <span
              className="text-[15px] font-semibold"
              style={{ color: prazoDias <= 3 ? '#C1272D' : '#1C1C1E' }}
            >
              {prazoDias < 0
                ? `Venceu há ${Math.abs(prazoDias)} dia${Math.abs(prazoDias) > 1 ? 's' : ''}`
                : prazoDias === 0
                  ? 'Vence hoje'
                  : `Vence em ${prazoDias} dia${prazoDias > 1 ? 's' : ''}`}
            </span>
          </div>
        )}

        {(mensagem.tipo === 'reuniao' || mensagem.tipo === 'evento') && (
          <div className="mt-4 space-y-3 rounded-2xl bg-card p-4">
            {p.data_evento && (
              <div className="flex items-center gap-2 text-[15px] text-foreground">
                <CalendarDays size={18} className="text-secondary" />
                {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
                  new Date(`${p.data_evento}T12:00:00Z`),
                )}
              </div>
            )}
            {p.hora_evento && (
              <div className="flex items-center gap-2 text-[15px] text-foreground">
                <Clock size={18} className="text-secondary" />
                {p.hora_evento}
              </div>
            )}
            {p.local_evento && (
              <div className="flex items-center gap-2 text-[15px] text-foreground">
                <MapPin size={18} className="text-secondary" />
                {p.local_evento}
              </div>
            )}
            <button
              type="button"
              onClick={() => baixarICS(assuntoDe(mensagem), p.data_evento, p.hora_evento, p.local_evento)}
              className="h-11 w-full rounded-xl text-[15px] font-semibold active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#E8EFF6', color: '#1B4F8C' }}
            >
              Adicionar ao meu calendário
            </button>
          </div>
        )}

        <div className="mt-4 whitespace-pre-line rounded-2xl bg-card p-4 text-[17px] leading-[24px] text-foreground">
          {corpoDe(mensagem) || 'Sem conteúdo adicional.'}
        </div>

        {anexos.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-secondary">
              Anexos
            </p>
            {anexos.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => abrirAnexo(a.url)}
                className="flex w-full items-center gap-3 rounded-xl bg-card p-4 text-left active:opacity-70"
              >
                <Paperclip size={18} className="text-secondary" />
                <span className="flex-1">
                  <span className="block text-[15px] font-medium text-foreground">{a.nome}</span>
                  <span className="block text-[13px] text-secondary">
                    {a.tipo_mime} · {tamanhoLegivel(a.tamanho)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {precisaConfirmar && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card p-4">
          <button
            type="button"
            onClick={confirmar}
            disabled={confirmando}
            className="h-12 w-full rounded-xl bg-primary text-[17px] font-semibold text-primary-foreground active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            Confirmar recebimento
          </button>
        </div>
      )}
    </div>
  )
}
