import React, { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { Eye, EyeOff } from 'lucide-react';

export const Step14: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [senha, setSenha] = useState(onboardingData.senha || '');
  const [show, setShow] = useState(false);

  // MVP: única regra é ter pelo menos 4 caracteres.
  const senhaValida = senha.length >= 4;
  const erroSenha = senha.length > 0 && !senhaValida ? 'A senha deve ter pelo menos 4 caracteres.' : null;

  const handleNext = () => {
    if (senhaValida) {
      updateData({ senha });
      nextStep();
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Crie uma senha</h2>

      <div className="space-y-6">
        <div>
          <label className="text-label text-secondary ml-1 mb-2 block">Senha (mín. 4 caracteres)</label>
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              placeholder="••••"
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

          {erroSenha && (
            <span className="text-error text-label mt-2 block ml-1">{erroSenha}</span>
          )}
        </div>
      </div>

      <div className="fixed bottom-8 left-5 right-5">
        <button onClick={handleNext} disabled={!senhaValida} className="btn-primary">
          Continuar
        </button>
      </div>
    </div>
  );
};
