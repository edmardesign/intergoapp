import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout'
import { Step1 } from '@/components/onboarding/steps/Step1'
import { Step2 } from '@/components/onboarding/steps/Step2'
import { Step3 } from '@/components/onboarding/steps/Step3'
import { Step4 } from '@/components/onboarding/steps/Step4'
import { Step5 } from '@/components/onboarding/steps/Step5'
import { Step6 } from '@/components/onboarding/steps/Step6'
// Step7 removed
import { Step8 } from '@/components/onboarding/steps/Step8'
import { Step9 } from '@/components/onboarding/steps/Step9'
import { Step10 } from '@/components/onboarding/steps/Step10'
import { Step11 } from '@/components/onboarding/steps/Step11'
// Step12 removida (endereço duplicado)
import { Step13 } from '@/components/onboarding/steps/Step13'
import { Step14 } from '@/components/onboarding/steps/Step14'
import { Step15 } from '@/components/onboarding/steps/Step15'
import { useOnboardingStore } from '@/lib/onboarding-store'

export const Route = createFileRoute('/onboarding/')({
  component: OnboardingComponent
})

function OnboardingComponent() {
  const { data, nextStep, goToStep } = useOnboardingStore()
  const step = data.step

  // Hierarchy Logic: Skip Step 6 if not needed
  React.useEffect(() => {
    const checkSkip = async () => {
      if (step === 6) {
        // Função livre (sem cargo cadastrado): não há lotação a escolher
        if (!data.cargo_id) {
          goToStep(8)
          return
        }
        const { getCargos } = await import('@/lib/onboarding.functions')
        const cargos = await getCargos({ data: data.secretaria_id! })
        const currentCargo = cargos?.find((c: any) => c.id === data.cargo_id)

        if (currentCargo) {
          // Rule: If secretaria has NO units, skip Step 6
          const { getUnidades } = await import('@/lib/onboarding.functions')
          const unidades = await getUnidades({ data: data.secretaria_id! })
          
          if (!unidades || unidades.length === 0) {
            goToStep(8)
            return
          }

          // Rule: If scope is municipio/secretaria, skip Step 6
          if (currentCargo.escopo === 'municipio' || currentCargo.escopo === 'secretaria') {
            goToStep(8)
            return
          }
        }
      }
      // Telas removidas: 7 (antiga) e 12 (endereço duplicado)
      if (step === 7) {
        goToStep(8)
      }
      if (step === 12) {
        goToStep(13)
      }
    }
    
    checkSkip()
  }, [step, data.cargo_id, data.secretaria_id])

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1 />
      case 2: return <Step2 />
      case 3: return <Step3 />
      case 4: return <Step4 />
      case 5: return <Step5 />
      case 6: return <Step6 />
      case 7: return null // Skipped
      case 8: return <Step8 />
      case 9: return <Step9 />
      case 10: return <Step10 />
      case 11: return <Step11 />
      case 12: return null // Removida
      case 13: return <Step13 />
      case 14: return <Step14 />
      case 15: return <Step15 />
      default: return <Step1 />
    }
  }

  return (
    <OnboardingLayout currentStep={step} totalSteps={15}>
      {renderStep()}
    </OnboardingLayout>
  )
}
