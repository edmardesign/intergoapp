import React, { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';

export const Step9: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [cpf, setCpf] = useState(onboardingData.cpf || '');
  const [error, setError] = useState('');

  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = formatCPF(e.target.value);
    setCpf(val);
    
    if (val.length === 14) {
      if (!validateCPF(val)) {
        setError('CPF inválido');
      } else {
        setError('');
      }
    } else {
      setError('');
    }
  };

  const handleNext = () => {
    if (validateCPF(cpf)) {
      updateData({ cpf });
      nextStep();
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Seu CPF?</h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-label text-secondary ml-1 mb-2 block">Número do CPF</label>
          <input 
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            className={`input-field ${error ? 'input-error' : ''}`}
            value={cpf}
            onChange={handleChange}
            autoFocus
          />
          {error && <span className="text-error text-label mt-2 block ml-1">{error}</span>}
        </div>
      </div>

      <div className="fixed bottom-8 left-5 right-5">
        <button 
          onClick={handleNext} 
          disabled={!validateCPF(cpf)}
          className="btn-primary"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};
