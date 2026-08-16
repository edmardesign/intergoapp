import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { XCircle, RefreshCw } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useEffect, useState } from 'react'
import { useOnboardingStore } from '@/lib/onboarding-store'

export const Route = createFileRoute('/onboarding/negado')({
  component: NegadoComponent
})

function NegadoComponent() {
  const navigate = useNavigate()
  const clearStore = useOnboardingStore(state => state.clear)
  
  // No prompt original não diz onde vem o motivo, mas sugeriu criar campo depois.
  // Vamos assumir que existe um campo motivo_negativa em perfis futuramente.
  const [motivo, setMotivo] = useState('Seus dados não puderam ser validados pelo superior.')

  const handleRetry = () => {
    clearStore()
    // @ts-ignore
    navigate({ to: '/onboarding' })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center">
      <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mb-8">
        <XCircle size={48} />
      </div>
      
      <h1 className="text-screen-title mb-4">Cadastro negado</h1>
      
      <p className="text-body text-secondary mb-12 max-w-[280px]">
        {motivo}
      </p>

      <button 
        onClick={handleRetry}
        className="btn-primary"
      >
        <RefreshCw size={20} className="mr-2" />
        Refazer cadastro
      </button>
    </div>
  )
}
