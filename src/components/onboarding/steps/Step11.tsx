import React, { useState, useEffect } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';

export const Step11: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [cep, setCep] = useState(onboardingData.cep || '');
  const [loading, setLoading] = useState(false);

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setLoading(true);
      fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            updateData({
              logradouro: data.logradouro,
              bairro: data.bairro,
              cidade_texto: data.localidade
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, [cep]);

  const handleNext = () => {
    if (cep.replace(/\D/g, '').length === 8) {
      updateData({ cep });
      nextStep();
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Qual seu CEP?</h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-label text-secondary ml-1 mb-2 block">CEP</label>
          <div className="relative">
            <input 
              type="text"
              inputMode="numeric"
              placeholder="00000-000"
              className="input-field"
              value={cep}
              onChange={(e) => setCep(formatCEP(e.target.value))}
              autoFocus
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
        
        {onboardingData.logradouro && (
          <div className="p-4 bg-white rounded-[16px] animate-in fade-in slide-in-from-top-2">
            <p className="text-body font-medium">{onboardingData.logradouro}</p>
            <p className="text-body-secondary text-secondary">
              {onboardingData.bairro}, {onboardingData.cidade_texto}
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-8 left-5 right-5">
        <button 
          onClick={handleNext} 
          disabled={cep.replace(/\D/g, '').length < 8 || loading}
          className="btn-primary"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};
