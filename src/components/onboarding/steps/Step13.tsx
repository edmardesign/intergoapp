import React, { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';

export const Step13: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [email, setEmail] = useState(onboardingData.email || '');
  const [error, setError] = useState('');

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (val && !validateEmail(val)) {
      setError('E-mail inválido');
    } else {
      setError('');
    }
  };

  const handleNext = () => {
    if (validateEmail(email)) {
      updateData({ email });
      nextStep();
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Qual seu e-mail?</h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-label text-secondary ml-1 mb-2 block">E-mail</label>
          <input 
            type="email"
            placeholder="seu@email.com"
            className={`input-field ${error ? 'input-error' : ''}`}
            value={email}
            onChange={handleChange}
            autoFocus
            autoComplete="email"
          />
          {error && <span className="text-error text-label mt-2 block ml-1">{error}</span>}
        </div>
      </div>

      <div className="fixed bottom-8 left-5 right-5">
        <button 
          onClick={handleNext} 
          disabled={!validateEmail(email)}
          className="btn-primary"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};
