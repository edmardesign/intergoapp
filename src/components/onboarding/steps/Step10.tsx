import React, { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';

export const Step10: React.FC = () => {
  const { data, updateData, nextStep } = useOnboardingStore();
  const [tel, setTel] = useState(data.telefone || '');

  const formatTel = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 11);
    if (clean.length <= 10) {
      return clean.replace(/(\d{2})(\d{4})(\d{0,4})/, '() -');
    }
    return clean.replace(/(\d{2})(\d{5})(\d{0,4})/, '() -');
  };

  const handleNext = () => {
    if (tel.length >= 14) {
      updateData({ telefone: tel });
      nextStep();
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-5 duration-300">
      <h2 className="text-question mb-6">Seu WhatsApp</h2>
      
      <div className="space-y-4">
        <input 
          type="tel"
          placeholder="(00) 00000-0000"
          className="input-field"
          value={tel}
          onChange={(e) => setTel(formatTel(e.target.value))}
          autoFocus
        />
        <p className="text-body-secondary ml-1">
          Para que seus superiores e subordinados possam entrar em contato.
        </p>
      </div>

      <div className="fixed bottom-8 left-5 right-5">
        <button 
          onClick={handleNext} 
          disabled={tel.length < 14}
          className="btn-primary"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};
