import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { getNiveis } from '@/lib/onboarding.functions';

export const Step5: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [niveis, setNiveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (onboardingData.secretaria_id) {
      getNiveis({ data: onboardingData.secretaria_id }).then(data => {
        setNiveis(data || []);
        setLoading(false);
      });
    }
  }, [onboardingData.secretaria_id]);

  const handleSelect = (id: string) => {
    updateData({ nivel_id: id });
    nextStep();
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Qual o seu cargo/nível?</h2>
      
      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-[70px] bg-white rounded-[16px] animate-pulse" />
          ))
        ) : (
          niveis.map((nivel) => (
            <button
              key={nivel.id}
              onClick={() => handleSelect(nivel.id)}
              className="w-full card-lumina p-5 text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex flex-col">
                <span className="text-body font-semibold">{nivel.nome}</span>
                {nivel.descricao && <span className="text-label text-secondary mt-1">{nivel.descricao}</span>}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
