import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { Progress } from '@/components/ui/progress';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ children, currentStep, totalSteps }) => {
  const prevStep = useOnboardingStore((state) => state.prevStep);
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background">
        <Progress value={progress} className="h-1 rounded-none bg-[#E5E5EA]" />
      </div>

      {/* Header */}
      <header className="flex items-center px-5 pt-8 pb-4">
        {currentStep > 1 && currentStep < 16 && (
          <button 
            onClick={prevStep}
            className="flex items-center text-primary font-medium"
          >
            <ChevronLeft size={24} className="mr-1" />
            <span className="text-body">Voltar</span>
          </button>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 px-5 pb-32 animate-in slide-in-from-right duration-300 ease-out">
        {children}
      </main>
    </div>
  );
};
