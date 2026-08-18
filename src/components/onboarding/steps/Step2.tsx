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

  const term = search.toLowerCase();
  const filtered = estados.filter((e) => {
    const nome = String(e?.nome ?? '').toLowerCase();
    const sigla = String(e?.sigla ?? e?.uf ?? '').toLowerCase();
    return nome.includes(term) || sigla.includes(term);
  });

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
            <div key={i} className="h-[60px] bg-white rounded-2xl animate-pulse" />
          ))
        ) : (
          filtered.map((estado) => (
            <button
              key={estado.id}
              onClick={() => handleSelect(estado.id)}
              className="w-full card-intergo flex items-center justify-between text-body font-medium active:scale-[0.98] transition-transform"
            >
              <span>{estado.nome ?? estado.sigla ?? estado.uf}</span>
              <span className="text-secondary uppercase">{estado.sigla ?? estado.uf ?? ''}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
