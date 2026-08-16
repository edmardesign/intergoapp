import React, { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';

export const Step12: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [numero, setNumero] = useState(onboardingData.numero || '');
  const [complemento, setComplemento] = useState(onboardingData.complemento || '');

  const handleNext = () => {
    if (numero.trim()) {
      updateData({ numero, complemento });
      nextStep();
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Número e complemento?</h2>
      
      <div className="space-y-6">
        <div>
          <label className="text-label text-secondary ml-1 mb-2 block">Número</label>
          <input 
            type="text"
            placeholder="Ex: 123"
            className="input-field"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            autoFocus
          />
        </div>
        
        <div>
          <label className="text-label text-secondary ml-1 mb-2 block">Complemento (opcional)</label>
          <input 
            type="text"
            placeholder="Ex: Apto 101"
            className="input-field"
            value={complemento}
            onChange={(e) => setComplemento(e.target.value)}
          />
        </div>
      </div>

      <div className="fixed bottom-8 left-5 right-5">
        <button 
          onClick={handleNext} 
          disabled={!numero.trim()}
          className="btn-primary"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};
