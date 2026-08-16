import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CheckCircle2, LogOut } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/onboarding/aguardando')({
  component: AguardandoComponent
})

function AguardandoComponent() {
  const navigate = useNavigate()
  const [superiorNome, setSuperiorNome] = useState('')

  useEffect(() => {
    const fetchSuperior = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile } = await supabase
        .from('perfis')
        .select('superior_id')
        .eq('id', session.user.id)
        .single()

      if (profile?.superior_id) {
        const { data: publicos } = await (supabase as any).rpc('perfis_publicos_min')
        const superior = (publicos || []).find((p: any) => p.id === profile.superior_id)
        if (superior) setSuperiorNome(superior.nome_completo)
      }
    }

    fetchSuperior()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    // @ts-ignore
    navigate({ to: '/' })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
      <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mb-8">
        <CheckCircle2 size={48} />
      </div>
      
      <h1 className="text-screen-title mb-4">Aguardando liberação</h1>
      
      <p className="text-body text-secondary mb-12 max-w-[280px]">
        Seu cadastro foi enviado para <span className="text-foreground font-semibold">{superiorNome || 'seu superior'}</span>. 
        Você recebe um aviso assim que for liberado.
      </p>

      <button 
        onClick={handleSignOut}
        className="w-full h-[52px] bg-white text-secondary rounded-[12px] text-[17px] font-semibold flex items-center justify-center border border-border active:scale-[0.97] transition-transform"
      >
        <LogOut size={20} className="mr-2" />
        Sair
      </button>
    </div>
  )
}
