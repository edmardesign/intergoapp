import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { getEstados } from '@/lib/onboarding.functions';
import { Search } from 'lucide-react';

export const Step2: React.FC = () => {
  const { updateData, nextStep } = useOnboardingStore();
  const [estados, setEstados] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEstados().then(data => {
      setEstados(data || []);
      setLoading(false);
    });
  }, []);

  const filtered = estados.filter(e => 
    e.nome.toLowerCase().includes(search.toLowerCase()) ||
    e.sigla.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string) => {
    updateData({ estado_id: id });
    nextStep();
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Qual o seu estado?</h2>
      
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input 
          type="text"
          placeholder="Buscar estado..."
          className="input-field pl-12"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="h-[60px] bg-white rounded-[16px] animate-pulse" />
          ))
        ) : (
          filtered.map((estado) => (
            <button
              key={estado.id}
              onClick={() => handleSelect(estado.id)}
              className="w-full card-lumina flex items-center justify-between text-body font-medium active:scale-[0.98] transition-transform"
            >
              <span>{estado.nome}</span>
              <span className="text-secondary uppercase">{estado.sigla}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
