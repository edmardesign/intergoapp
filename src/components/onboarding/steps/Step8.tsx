import React, { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';

export const Step8: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [nome, setNome] = useState(onboardingData.nome_completo || '');

  const handleNext = () => {
    if (nome.trim().length > 3) {
      updateData({ nome_completo: nome.trim() });
      nextStep();
    }
  };

  const formatName = (val: string) => {
    return val.replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Qual seu nome completo?</h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-label text-secondary ml-1 mb-2 block">Nome completo</label>
          <input 
            type="text"
            placeholder="Ex: João Silva Santos"
            className="input-field"
            value={nome}
            onChange={(e) => setNome(formatName(e.target.value))}
            autoFocus
            autoComplete="name"
          />
        </div>
      </div>

      <div className="fixed bottom-8 left-5 right-5">
        <button 
          onClick={handleNext} 
          disabled={nome.trim().length <= 3}
          className="btn-primary"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};
