import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { getUnidades, getCargos } from '@/lib/onboarding.functions';
import { Search, MapPin, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Step6: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [unidades, setUnidades] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>(onboardingData.unidades_ids || []);
  const [cargo, setCargo] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!onboardingData.cargo_id || !onboardingData.secretaria_id) return;
      
      const [cargosData, unidadesData] = await Promise.all([
        getCargos({ data: onboardingData.secretaria_id }),
        getUnidades({ data: onboardingData.secretaria_id })
      ]);
      
      const currentCargo = cargosData?.find((c: any) => c.id === onboardingData.cargo_id);
      setCargo(currentCargo);
      setUnidades(unidadesData || []);
      setLoading(false);
      
      // If no unit needed, index.tsx will skip this, but safety check:
      if (currentCargo && (currentCargo.escopo === 'municipio' || currentCargo.escopo === 'secretaria')) {
        nextStep();
      }
    };

    loadData();
  }, [onboardingData.cargo_id, onboardingData.secretaria_id]);

  const filtered = unidades.filter(u => 
    String(u?.nome ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    if (cargo?.escopo === 'unidade') {
      updateData({ unidades_ids: [id] });
      nextStep();
    } else {
      setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  const handleMultiConfirm = () => {
    updateData({ unidades_ids: selectedIds });
    nextStep();
  };

  if (loading) return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Carregando unidades...</h2>
      <div className="space-y-3">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="h-[70px] bg-white rounded-[16px] animate-pulse" />
        ))}
      </div>
    </div>
  );

  const isMulti = cargo?.escopo === 'multi_unidade';

  return (
    <div className="flex flex-col animate-in fade-in duration-500 pb-32">
      <h2 className="text-question mb-2">
        {isMulti ? 'Quais unidades você coordena?' : 'Onde você trabalha?'}
      </h2>
      <p className="text-label text-secondary mb-6">
        {isMulti ? 'Selecione uma ou mais unidades' : 'Selecione sua unidade principal'}
      </p>
      
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
        {filtered.map((unidade) => {
          const isSelected = selectedIds.includes(unidade.id);
          return (
            <button
              key={unidade.id}
              onClick={() => toggleSelect(unidade.id)}
              className={cn(
                "w-full card-intergo flex items-center p-5 active:scale-[0.98] transition-all",
                isSelected && "border-primary bg-primary/5"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-[10px] flex items-center justify-center mr-4 transition-colors",
                isSelected ? "bg-primary text-white" : "bg-primary/5 text-primary"
              )}>
                {isSelected ? <Check size={20} /> : <MapPin size={20} />}
              </div>
              <span className={cn(
                "text-body font-semibold flex-1 text-left",
                isSelected && "text-primary"
              )}>
                {unidade.nome}
              </span>
              {isMulti && !isSelected && <ChevronRight size={20} className="text-muted-foreground/30" />}
            </button>
          );
        })}
      </div>

      {isMulti && (
        <div className="fixed bottom-8 left-5 right-5 flex flex-col gap-3">
          <div className="flex justify-between items-center px-2">
            <span className="text-label text-secondary">{selectedIds.length} selecionadas</span>
            {selectedIds.length > 0 && (
              <button 
                onClick={() => setSelectedIds([])} 
                className="text-label text-primary font-medium"
              >
                Limpar
              </button>
            )}
          </div>
          <button 
            disabled={selectedIds.length === 0}
            onClick={handleMultiConfirm} 
            className="btn-primary"
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
};