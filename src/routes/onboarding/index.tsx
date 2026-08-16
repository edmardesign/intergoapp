import { createFileRoute } from '@tanstack/react-router'
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout'
import { Step1 } from '@/components/onboarding/steps/Step1'
import { Step2 } from '@/components/onboarding/steps/Step2'
import { Step3 } from '@/components/onboarding/steps/Step3'
import { Step4 } from '@/components/onboarding/steps/Step4'
import { Step5 } from '@/components/onboarding/steps/Step5'
import { Step6 } from '@/components/onboarding/steps/Step6'
import { Step7 } from '@/components/onboarding/steps/Step7'
import { Step8 } from '@/components/onboarding/steps/Step8'
import { Step9 } from '@/components/onboarding/steps/Step9'
import { Step10 } from '@/components/onboarding/steps/Step10'
import { Step11 } from '@/components/onboarding/steps/Step11'
import { Step12 } from '@/components/onboarding/steps/Step12'
import { Step13 } from '@/components/onboarding/steps/Step13'
import { Step14 } from '@/components/onboarding/steps/Step14'
import { Step15 } from '@/components/onboarding/steps/Step15'
import { useOnboardingStore } from '@/lib/onboarding-store'

export const Route = createFileRoute('/onboarding/')({
  component: OnboardingComponent
})

function OnboardingComponent() {
  const step = useOnboardingStore((state) => state.data.step)

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1 />
      case 2: return <Step2 />
      case 3: return <Step3 />
      case 4: return <Step4 />
      case 5: return <Step5 />
      case 6: return <Step6 />
      case 7: return <Step7 />
      case 8: return <Step8 />
      case 9: return <Step9 />
      case 10: return <Step10 />
      case 11: return <Step11 />
      case 12: return <Step12 />
      case 13: return <Step13 />
      case 14: return <Step14 />
      case 15: return <Step15 />
      default: return <Step1 />
    }
  }

  return (
    <OnboardingLayout currentStep={step} totalSteps={16}>
      {renderStep()}
    </OnboardingLayout>
  )
}
