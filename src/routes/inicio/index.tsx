import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/inicio/')({
  component: InicioComponent
})

function InicioComponent() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // @ts-ignore
        navigate({ to: '/login' })
        return
      }

      const { data: profile } = await supabase
        .from('perfis')
        .select('status')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.status !== 'ativo') {
        // @ts-ignore
        navigate({ to: '/' })
      }
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <h1 className="text-screen-title mb-4">Bem-vindo ao Lumina</h1>
      <p className="text-body text-secondary max-w-[280px]">
        Início será construído na próxima etapa.
      </p>
      <button 
        onClick={() => supabase.auth.signOut().then(() => navigate({ to: '/login' }))}
        className="mt-8 text-primary font-semibold"
      >
        Sair
      </button>
    </div>
  )
}
