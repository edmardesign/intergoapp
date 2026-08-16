import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { getSuperiores, getNiveis } from '@/lib/onboarding.functions';
import { User, Check } from 'lucide-react';

export const Step7: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [superiores, setSuperiores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Quem é seu superior direto?");

  useEffect(() => {
    const fetchData = async () => {
      if (!onboardingData.nivel_id || !onboardingData.municipio_id) return;

      const { data: niveis } = await getNiveis({ data: onboardingData.secretaria_id || "" });
      const currentLevel = niveis?.find((n: any) => n.id === onboardingData.nivel_id);
      
      if (!currentLevel) return;

      // Set dynamic title based on superior level name
      const superiorLevel = niveis?.find((n: any) => n.ordem === currentLevel.ordem - 1);
      if (superiorLevel) {
        setTitle(`Quem é seu ${superiorLevel.nome.toLowerCase()}?`);
      } else if (currentLevel.ordem === 1) {
        setTitle("Quem é o Prefeito?");
      }

      const data = await getSuperiores({ 
        data: {
          municipio_id: onboardingData.municipio_id,
          secretaria_id: onboardingData.secretaria_id || "",
          nivel_ordem: currentLevel.ordem,
          unidade_id: onboardingData.unidade_id ? onboardingData.unidade_id : undefined
        } 
      });

      if (data && data.length === 1) {
        updateData({ superior_id: data[0].id });
        nextStep();
      } else {
        setSuperiores(data || []);
        setLoading(false);
      }
    };

    fetchData();
  }, [onboardingData.nivel_id, onboardingData.municipio_id, onboardingData.unidade_id]);

  const handleSelect = (id: string) => {
    updateData({ superior_id: id });
    nextStep();
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">{title}</h2>
      
      <div className="space-y-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-[80px] bg-white rounded-[16px] animate-pulse" />
          ))
        ) : superiores.length > 0 ? (
          superiores.map((superior) => (
            <button
              key={superior.id}
              onClick={() => handleSelect(superior.id)}
              className="w-full card-lumina flex items-center p-5 active:scale-[0.98] transition-transform"
            >
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mr-4">
                <User size={24} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-body font-semibold">{superior.nome_completo}</span>
                <span className="text-label text-secondary">{superior.nivel_nome || 'Superior'}</span>
              </div>
              <Check className="ml-auto text-primary opacity-0 group-hover:opacity-100" size={20} />
            </button>
          ))
        ) : (
          <div className="p-8 text-center bg-white rounded-[20px]">
            <p className="text-body text-secondary">Nenhum superior encontrado para os filtros selecionados.</p>
            <button onClick={nextStep} className="mt-4 text-primary font-semibold">Pular etapa</button>
          </div>
        )}
      </div>
    </div>
  );
};
