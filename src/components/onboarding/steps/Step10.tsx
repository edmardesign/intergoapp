import React, { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';

export const Step10: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [phone, setPhone] = useState(onboardingData.telefone || '');

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleNext = () => {
    if (phone.length >= 14) {
      updateData({ telefone: phone });
      nextStep();
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Seu WhatsApp?</h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-label text-secondary ml-1 mb-2 block">Telefone</label>
          <input 
            type="text"
            inputMode="numeric"
            placeholder="(00) 00000-0000"
            className="input-field"
            value={phone}
            onChange={handleChange}
            autoFocus
          />
        </div>
      </div>

      <div className="fixed bottom-8 left-5 right-5">
        <button 
          onClick={handleNext} 
          disabled={phone.length < 14}
          className="btn-primary"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};
