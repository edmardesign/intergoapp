import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { getMunicipios, addToWaitlist } from '@/lib/onboarding.functions';
import { Search, Send } from 'lucide-react';

export const Step3: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [waitlistSent, setWaitlistSent] = useState(false);

  useEffect(() => {
    if (onboardingData.estado_id) {
      getMunicipios({ data: onboardingData.estado_id }).then(data => {
        setMunicipios(data || []);
        setLoading(false);
      });
    }
  }, [onboardingData.estado_id]);

  const filtered = municipios.filter(m => 
    m.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string) => {
    updateData({ municipio_id: id });
    nextStep();
  };

  const handleWaitlist = async () => {
    if (!email || !onboardingData.estado_id) return;
    await addToWaitlist({ data: { email, estado_id: onboardingData.estado_id, cidade_texto: search } });
    setWaitlistSent(true);
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Qual a sua cidade?</h2>
      
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
        <input 
          type="text"
          placeholder="Buscar cidade..."
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
        ) : filtered.length > 0 ? (
          filtered.map((municipio) => (
            <button
              key={municipio.id}
              onClick={() => handleSelect(municipio.id)}
              className="w-full card-lumina text-left text-body font-medium active:scale-[0.98] transition-transform"
            >
              {municipio.nome}
            </button>
          ))
        ) : search.length > 2 && (
          <div className="p-6 bg-[#FFEBEA] rounded-[20px] text-center">
            <p className="text-body font-semibold text-[#C1272D] mb-4">
              Sua cidade ainda não usa o app
            </p>
            {waitlistSent ? (
              <p className="text-body-secondary text-[#C1272D]">
                Avisaremos você assim que o Lumina chegar em {search}!
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-body-secondary text-[#C1272D]">
                  Deixe seu e-mail para avisarmos quando chegar.
                </p>
                <div className="relative">
                  <input 
                    type="email"
                    placeholder="Seu melhor e-mail"
                    className="input-field border-[#C1272D]/30"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button 
                    onClick={handleWaitlist}
                    disabled={!email.includes('@')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#C1272D] text-white rounded-[10px] flex items-center justify-center disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
