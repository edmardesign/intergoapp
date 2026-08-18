import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { getCargos } from '@/lib/onboarding.functions';

export const Step5: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [cargos, setCargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (onboardingData.secretaria_id) {
      getCargos({ data: onboardingData.secretaria_id }).then(data => {
        setCargos(data || []);
        setLoading(false);
      });
    }
  }, [onboardingData.secretaria_id]);

  const handleSelect = (cargo: any) => {
    updateData({ cargo_id: cargo.id });
    
    // Auto-navigate logic based on scope
    if (cargo.escopo === 'municipio' || cargo.escopo === 'secretaria') {
      updateData({ unidades_ids: [] });
      nextStep(); // This skips Step 6 and Step 7 if logic is in index.tsx
      // Wait, let's make index.tsx handle the jump.
    }
    nextStep();
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Qual o seu cargo?</h2>
      
      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-[70px] bg-white rounded-2xl animate-pulse" />
          ))
        ) : (
          cargos.map((cargo) => (
            <button
              key={cargo.id}
              onClick={() => handleSelect(cargo)}
              className="w-full card-intergo p-5 text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex flex-col">
                <span className="text-body font-semibold">{cargo.nome}</span>
                <span className="text-label text-secondary mt-1 capitalize">{cargo.escopo.replace('_', ' ')}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};