import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { getSecretarias } from '@/lib/onboarding.functions';
import { School, Stethoscope, Construction, Briefcase } from 'lucide-react';

const iconMap: Record<string, any> = {
  'Educação': School,
  'Saúde': Stethoscope,
  'Obras': Construction,
  'default': Briefcase
};

export const Step4: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [secretarias, setSecretarias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (onboardingData.municipio_id) {
      getSecretarias({ data: onboardingData.municipio_id }).then(data => {
        setSecretarias(data || []);
        setLoading(false);
      });
    }
  }, [onboardingData.municipio_id]);

  const handleSelect = (id: string) => {
    updateData({ secretaria_id: id });
    nextStep();
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Em qual secretaria você atua?</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-[80px] bg-white rounded-2xl animate-pulse" />
          ))
        ) : (
          secretarias.map((sec) => {
            const Icon = iconMap[sec.nome] || iconMap['default'];
            return (
              <button
                key={sec.id}
                onClick={() => handleSelect(sec.id)}
                className="w-full card-intergo flex items-center p-5 active:scale-[0.98] transition-transform"
              >
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-[12px] flex items-center justify-center mr-4">
                  <Icon size={24} />
                </div>
                <span className="text-body font-semibold">{sec.nome}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
