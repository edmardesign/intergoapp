import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, Users as UsersIcon, Send } from 'lucide-react'

export const Route = createFileRoute('/inicio/')({
  component: InicioComponent
})

function InicioComponent() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [pendentesCount, setPendentesCount] = useState(0)
  const [canSend, setCanSend] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate({ to: '/login' })
        return
      }

      const { data: profile } = await supabase
        .from('perfis')
        .select('status, nivel:nivel_id(nome)')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.status !== 'ativo') {
        navigate({ to: '/' })
        return
      }
      
      const role = (profile as any).nivel?.nome || ''
      setCanSend(!role.toLowerCase().includes('professor'))

      const { count } = await supabase
        .from('perfis')
        .select('*', { count: 'exact', head: true })
        .eq('superior_id', session.user.id)
        .eq('status', 'pendente')

      setPendentesCount(count || 0)
      setLoading(false)
    }
    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <h1 className="text-screen-title mb-6">Início</h1>
      
      {pendentesCount > 0 && (
        <div className="mb-6">
          <Link 
            to="/equipe"
            search={{ aba: 'pendentes' }}
            className="w-full card-intergo border border-primary/20 bg-primary/5 flex items-center p-4 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mr-4">
              <UsersIcon size={20} />
            </div>
            <div className="flex flex-col text-left flex-1">
              <span className="text-[15px] font-bold text-primary">Pendências da sua equipe</span>
              <span className="text-[13px] text-primary/70">{pendentesCount} cadastros aguardando aprovação — Ver equipe →</span>
            </div>
          </Link>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {canSend ? (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
              <Send size={32} />
            </div>
            <h2 className="text-xl font-bold">Pronto para enviar?</h2>
            <p className="text-body text-secondary max-w-[260px] mx-auto">
              Envie comunicados, demandas ou agende reuniões com sua equipe.
            </p>
            <Link to="/enviar" className="btn-primary px-8 inline-flex w-auto">
              Nova mensagem
            </Link>
          </div>
        ) : (
          <div className="opacity-50">
            <p className="text-body text-secondary max-w-[280px]">
              Seu feed de mensagens aparecerá aqui na próxima etapa.
            </p>
          </div>
        )}
        
        <button 
          onClick={() => supabase.auth.signOut().then(() => navigate({ to: '/login' }))}
          className="mt-12 text-secondary text-sm font-medium"
        >
          Sair da conta
        </button>
      </div>
    </div>
  )
}
