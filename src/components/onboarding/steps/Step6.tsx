import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { getUnidades, getNiveis } from '@/lib/onboarding.functions';
import { Search, MapPin } from 'lucide-react';

export const Step6: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [unidades, setUnidades] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [needsUnit, setNeedsUnit] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRequirement = async () => {
      if (!onboardingData.nivel_id) return;
      
      // We need to know if this level requires a unit
      const { data: niveis } = await (getNiveis({ data: onboardingData.secretaria_id! }));
      const currentLevel = niveis?.find((n: any) => n.id === onboardingData.nivel_id);
      
      if (currentLevel && !currentLevel.tem_unidade) {
        setNeedsUnit(false);
        nextStep();
      } else {
        setNeedsUnit(true);
        if (onboardingData.secretaria_id) {
          const data = await getUnidades({ data: onboardingData.secretaria_id });
          setUnidades(data || []);
        }
        setLoading(false);
      }
    };

    checkRequirement();
  }, [onboardingData.nivel_id, onboardingData.secretaria_id]);

  const filtered = unidades.filter(u => 
    u.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string) => {
    updateData({ unidade_id: id });
    nextStep();
  };

  if (needsUnit === false) return null;

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Onde você trabalha?</h2>
      
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input 
          type="text"
          placeholder="Buscar unidade..."
          className="input-field pl-12"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-[70px] bg-white rounded-[16px] animate-pulse" />
          ))
        ) : (
          filtered.map((unidade) => (
            <button
              key={unidade.id}
              onClick={() => handleSelect(unidade.id)}
              className="w-full card-intergo flex items-center p-5 active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 bg-primary/5 text-primary rounded-[10px] flex items-center justify-center mr-4">
                <MapPin size={20} />
              </div>
              <span className="text-body font-semibold">{unidade.nome}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
