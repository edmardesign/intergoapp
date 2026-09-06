import React, { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';

export const Step9: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [cpf, setCpf] = useState(onboardingData.cpf || '');
  const [error, setError] = useState('');

  const validateCPF = (val: string) => {
    const cleanCPF = val.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    
    // Check for identical digits
    if (/^(\d)\1+$/.test(cleanCPF)) return false;

    // Validate digits
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCPF.substring(i-1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCPF.substring(i-1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
    
    return true;
  };

  const handleNext = () => {
    if (validateCPF(cpf)) {
      updateData({ cpf });
      nextStep();
    } else {
      setError('CPF inválido. Verifique os números.');
    }
  };

  const formatCPF = (val: string) => {
    const clean = val.replace(/\D/g, '').substring(0, 11);
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-5 duration-300">
      <h2 className="text-question mb-6">Qual seu CPF?</h2>
      
      <div className="space-y-4">
        <input 
          type="tel"
          placeholder="000.000.000-00"
          className={`input-field ${error ? 'ring-2 ring-error' : ''}`}
          value={cpf}
          onChange={(e) => {
            setCpf(formatCPF(e.target.value));
            setError('');
          }}
          autoFocus
        />
        {error && <p className="text-error text-sm ml-1">{error}</p>}
        <p className="text-body-secondary ml-1">
          Usamos seu CPF apenas para garantir que seu cadastro seja único e seguro.
        </p>
      </div>

      <div className="fixed bottom-8 left-5 right-5">
        <button 
          onClick={handleNext} 
          disabled={cpf.length < 14}
          className="btn-primary"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};
