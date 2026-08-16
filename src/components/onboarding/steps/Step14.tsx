import React, { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { Eye, EyeOff } from 'lucide-react';

export const Step14: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [senha, setSenha] = useState(onboardingData.senha || '');
  const [show, setShow] = useState(false);

  const getStrength = (val: string) => {
    if (val.length === 0) return { label: '', color: 'bg-border', width: '0%' };
    if (val.length < 6) return { label: 'Fraca', color: 'bg-error', width: '33%' };
    if (val.length < 10) return { label: 'Média', color: 'bg-warning', width: '66%' };
    return { label: 'Forte', color: 'bg-success', width: '100%' };
  };

  const strength = getStrength(senha);

  const handleNext = () => {
    if (senha.length >= 8) {
      updateData({ senha });
      nextStep();
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Crie uma senha</h2>
      
      <div className="space-y-6">
        <div>
          <label className="text-label text-secondary ml-1 mb-2 block">Senha (mín. 8 caracteres)</label>
          <div className="relative">
            <input 
              type={show ? 'text' : 'password'}
              placeholder="••••••••"
              className="input-field pr-12"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoFocus
            />
            <button 
              onClick={() => setShow(!show)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary"
            >
              {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-label text-secondary">Força da senha</span>
              <span className={`text-label font-semibold ${strength.label === 'Fraca' ? 'text-error' : strength.label === 'Média' ? 'text-warning' : 'text-success'}`}>
                {strength.label}
              </span>
            </div>
            <div className="h-1 w-full bg-[#E5E5EA] rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${strength.color}`} 
                style={{ width: strength.width }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 left-5 right-5">
        <button 
          onClick={handleNext} 
          disabled={senha.length < 8}
          className="btn-primary"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};
