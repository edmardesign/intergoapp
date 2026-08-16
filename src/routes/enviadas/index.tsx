import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, ChevronRight, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { TipoBadge } from '@/components/mensagens/TipoBadge'
import { assuntoDe, listarEnviadas, tempoRelativo, type MensagemEnviada } from '@/lib/mensagens'

export const Route = createFileRoute('/enviadas/')({
  component: EnviadasPage,
})

function EnviadasPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [itens, setItens] = useState<MensagemEnviada[]>([])

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
        setItens(await listarEnviadas(session.user.id))
      } catch {
        toast.error('Não foi possível carregar suas mensagens enviadas.')
      }
      setLoading(false)
    }
    carregar()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-6">
      <button
        type="button"
        onClick={() => navigate({ to: '/inicio', search: {} })}
        className="mb-4 flex items-center gap-1 text-[15px] font-medium text-primary active:opacity-60"
      >
        <ArrowLeft size={18} />
        Início
      </button>

      <h1 className="mb-5 text-[28px] leading-[34px] font-bold text-foreground">Enviadas</h1>

      {itens.length === 0 ? (
        <div className="rounded-2xl bg-card p-4 text-[15px] text-secondary">
          Você ainda não enviou mensagens.
        </div>
      ) : (
        <div className="space-y-3">
          {itens.map(({ mensagem, total, confirmados }) => (
            <button
              key={mensagem.id}
              type="button"
              onClick={() => navigate({ to: '/enviadas/$id', params: { id: mensagem.id } })}
              className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left active:opacity-70"
            >
              <span className="flex-1">
                <TipoBadge tipo={mensagem.tipo} />
                <span className="mt-2 block text-[17px] leading-[22px] font-semibold text-foreground">
                  {assuntoDe(mensagem)}
                </span>
                <span className="mt-1 block text-[13px] leading-[18px] text-secondary">
                  Enviada para {total} pessoa{total === 1 ? '' : 's'} ·{' '}
                  {tempoRelativo(mensagem.created_at)}
                  {mensagem.exigir_confirmacao ? ` · ${confirmados} de ${total} confirmaram` : ''}
                </span>
              </span>
              <ChevronRight size={18} style={{ color: '#AEAEB2' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
