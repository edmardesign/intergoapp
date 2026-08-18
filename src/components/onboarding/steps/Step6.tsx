import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { getUnidades, getCargos } from '@/lib/onboarding.functions';
import { Loader2, Check } from 'lucide-react';

export const Step6: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [unidades, setUnidades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>(onboardingData.unidades_ids || []);
  const [cargo, setCargo] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unidadesData, cargosData] = await Promise.all([
          getUnidades({ data: onboardingData.secretaria_id! }),
          getCargos({ data: onboardingData.secretaria_id! })
        ]);
        
        setUnidades(unidadesData || []);
        const currentCargo = cargosData?.find((c: any) => c.id === onboardingData.cargo_id);
        setCargo(currentCargo);

        // Auto-advance logic if only 1 unit and unique scope
        if (unidadesData?.length === 1 && currentCargo?.escopo === 'unidade') {
          updateData({ unidades_ids: [unidadesData[0].id] });
          nextStep();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleUnidade = (id: string) => {
    if (cargo?.escopo === 'unidade') {
      setSelectedIds([id]);
    } else {
      setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  const handleNext = () => {
    if (selectedIds.length > 0) {
      updateData({ unidades_ids: selectedIds });
      nextStep();
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-5 duration-300 pb-32">
      <h2 className="text-question mb-2">Onde você trabalha?</h2>
      <p className="text-body-secondary mb-6">
        {cargo?.escopo === 'unidade' ? 'Selecione sua unidade de lotação.' : 'Selecione as unidades onde você atua.'}
      </p>
      
      <div className="space-y-3">
        {unidades.map((u) => {
          const isSelected = selectedIds.includes(u.id);
          return (
            <button
              key={u.id}
              onClick={() => toggleUnidade(u.id)}
              className={`card-intergo flex items-center justify-between border-2 transition-all ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-transparent'}`}
            >
              <div className="text-left">
                <p className="text-body font-bold">{u.nome}</p>
                <p className="text-[12px] text-secondary">{u.bairro || 'Unidade Municipal'}</p>
              </div>
              {isSelected && <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white"><Check size={14} /></div>}
            </button>
          );
        })}
      </div>

      <div className="fixed bottom-8 left-5 right-5">
        <button 
          onClick={handleNext} 
          disabled={selectedIds.length === 0}
          className="btn-primary"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};
