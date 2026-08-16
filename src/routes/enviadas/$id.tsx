import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { TipoBadge } from '@/components/mensagens/TipoBadge'
import {
  assuntoDe,
  cobrancaAtiva,
  dataExtensa,
  getMensagem,
  horaCurta,
  listarDestinatarios,
  registrarCobranca,
  type DestinatarioStatus,
  type Mensagem,
} from '@/lib/mensagens'

export const Route = createFileRoute('/enviadas/$id')({
  component: DetalheEnviada,
})

function DetalheEnviada() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)
  const [linhas, setLinhas] = useState<DestinatarioStatus[]>([])
  const [aba, setAba] = useState<'confirmaram' | 'nao'>('confirmaram')
  const [cobrados, setCobrados] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const carregar = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        navigate({ to: '/login' })
        return
      }
      try {
        const [msg, dests] = await Promise.all([getMensagem(id), listarDestinatarios(id)])
        setMensagem(msg)
        setLinhas(dests)
        const estado: Record<string, boolean> = {}
        for (const d of dests) estado[d.destinatario_id] = cobrancaAtiva(id, d.destinatario_id)
        setCobrados(estado)
      } catch {
        toast.error('Não foi possível carregar o acompanhamento.')
      }
      setLoading(false)
    }
    carregar()
  }, [id, navigate])

  const confirmaram = useMemo(
    () =>
      linhas
        .filter((l) => l.confirmado_em)
        .sort(
          (a, b) =>
            new Date(a.confirmado_em as string).getTime() -
            new Date(b.confirmado_em as string).getTime(),
        ),
    [linhas],
  )
  const naoConfirmaram = useMemo(() => linhas.filter((l) => !l.confirmado_em), [linhas])

  const cobrar = (linha: DestinatarioStatus) => {
    registrarCobranca(id, linha.destinatario_id)
    setCobrados((prev) => ({ ...prev, [linha.destinatario_id]: true }))
    toast.success(`Cobrança enviada para ${linha.pessoa.nome}.`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  const lista = aba === 'confirmaram' ? confirmaram : naoConfirmaram

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-6">
      <button
        type="button"
        onClick={() => navigate({ to: '/enviadas' })}
        className="mb-4 flex items-center gap-1 text-[15px] font-medium text-primary active:opacity-60"
      >
        <ArrowLeft size={18} />
        Enviadas
      </button>

      {mensagem && (
        <>
          <TipoBadge tipo={mensagem.tipo} />
          <h1 className="mt-2 text-[24px] leading-[30px] font-bold text-foreground">
            {assuntoDe(mensagem)}
          </h1>
          <p className="mt-1 text-[13px] text-secondary">{dataExtensa(mensagem.created_at)}</p>
        </>
      )}

      <div className="mt-5 flex gap-2 rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setAba('confirmaram')}
          className={cn(
            'flex-1 rounded-lg py-2 text-[14px] font-semibold',
            aba === 'confirmaram' ? 'bg-card text-primary' : 'text-secondary',
          )}
        >
          Confirmaram ({confirmaram.length})
        </button>
        <button
          type="button"
          onClick={() => setAba('nao')}
          className={cn(
            'flex-1 rounded-lg py-2 text-[14px] font-semibold',
            aba === 'nao' ? 'bg-card text-primary' : 'text-secondary',
          )}
        >
          Não confirmaram ({naoConfirmaram.length})
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {lista.length === 0 ? (
          <div className="rounded-2xl bg-card p-4 text-[15px] text-secondary">
            {aba === 'confirmaram' ? 'Ninguém confirmou ainda.' : 'Todos já confirmaram.'}
          </div>
        ) : (
          lista.map((l) => (
            <div
              key={l.destinatario_id}
              className="flex items-center gap-3 rounded-2xl bg-card p-4"
            >
              <div className="flex-1">
                <p className="text-[15px] leading-[20px] font-medium text-foreground">
                  {l.pessoa.nome}
                </p>
                <p className="text-[13px] leading-[18px] text-secondary">
                  {[l.pessoa.cargo, l.pessoa.unidade].filter(Boolean).join(' · ') || '—'}
                  {l.confirmado_em ? ` · ${horaCurta(l.confirmado_em)}` : ''}
                </p>
              </div>
              {aba === 'nao' && (
                <button
                  type="button"
                  onClick={() => cobrar(l)}
                  disabled={!!cobrados[l.destinatario_id]}
                  className="h-9 rounded-lg px-3 text-[13px] font-semibold disabled:opacity-50"
                  style={{ backgroundColor: '#E8EFF6', color: '#1B4F8C' }}
                >
                  {cobrados[l.destinatario_id] ? 'Cobrado' : 'Cobrar'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
