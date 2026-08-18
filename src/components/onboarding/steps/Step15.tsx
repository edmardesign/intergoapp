import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from '@tanstack/react-router';
import { Edit2, Loader2, Check } from 'lucide-react';

export const Step15: React.FC = () => {
  const { data, goToStep, clear } = useOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [superiorName, setSuperiorName] = useState<string>('Direção Central');
  const navigate = useNavigate();

  useEffect(() => {
    // Save to localStorage as a draft
    localStorage.setItem('intergo_onboarding_draft', JSON.stringify(data));
    
    // Attempt to pre-calculate superior name for review
    const fetchSuperior = async () => {
       if (data.cargo_id) {
         const { data: cargos } = await supabase.from('cargos').select('*');
         const cargo = cargos?.find(c => c.id === data.cargo_id);
         const cargoSuperior = cargos?.find(c => c.id === cargo?.cargo_superior_id);
         if (cargoSuperior) setSuperiorName(cargoSuperior.nome);
       }
    };
    fetchSuperior();
  }, [data]);

  const handleFinish = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email!,
        password: data.senha!,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: cargos } = await supabase.from('cargos').select('*');
        const cargo = cargos?.find(c => c.id === data.cargo_id);
        const cargoSuperior = cargos?.find(c => c.id === cargo?.cargo_superior_id);
        
        let calculatedSuperiorId = null;

        if (cargoSuperior) {
          const { data: superiors } = await supabase
            .from('perfis')
            .select('id, created_at, municipio_id')
            .eq('nivel_id', cargoSuperior.id)
            .eq('status', 'ativo');
            
          const filtered = superiors?.filter(s => {
            if (cargoSuperior.escopo === 'municipio' || cargoSuperior.escopo === 'secretaria') {
              return s.municipio_id === data.municipio_id;
            }
            return true;
          });

          if (filtered && filtered.length > 0) {
             const sortedSuperiors = [...filtered].sort((a: any, b: any) => 
               new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
             );
             if (sortedSuperiors.length > 0 && sortedSuperiors[0]) {
               calculatedSuperiorId = sortedSuperiors[0].id;
             }
          }
        }

        const { error: profileError } = await (supabase as any)
          .from('perfis')
          .insert({
            id: authData.user.id,
            nome_completo: data.nome_completo!,
            cpf: data.cpf!.replace(/\D/g, ''),
            telefone: data.telefone!.replace(/\D/g, ''),
            cep: data.cep!.replace(/\D/g, ''),
            logradouro: data.logradouro || null,
            numero: data.numero || null,
            complemento: data.complemento || null,
            bairro: data.bairro || null,
            municipio_id: data.municipio_id || null,
            secretaria_id: data.secretaria_id || null,
            nivel_id: data.cargo_id || null,
            superior_id: calculatedSuperiorId,
            funcao: data.funcao || null,
            status: 'pendente'
          });

        if (profileError) throw profileError;

        if (data.unidades_ids && data.unidades_ids.length > 0) {
          const lotacoes = data.unidades_ids.map((uid, index) => ({
            perfil_id: authData?.user?.id as string,
            unidade_id: uid,
            principal: index === 0
          }));
          await supabase.from('perfil_unidades').insert(lotacoes);
        }

        localStorage.removeItem('intergo_onboarding_draft');
        clear();
        navigate({ to: '/onboarding/aguardando' } as any);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar cadastro');
      setLoading(false);
    }
  };

  const rows = [
    { label: 'Identificação', value: data.nome_completo, step: 8 },
    { label: 'Função', value: data.funcao, step: 8 },
    { label: 'CPF', value: data.cpf, step: 9 },
    { label: 'Local', value: data.unidades_ids?.length ? `${data.unidades_ids.length} selecionado(s)` : null, step: 6 },
    { label: 'E-mail', value: data.email, step: 13 },
  ];

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-5 duration-300 pb-40">
      <h2 className="text-question mb-2">Tudo pronto!</h2>
      <p className="text-body-secondary mb-6">Confira seus dados antes de enviar.</p>
      
      <div className="space-y-3">
        {rows.filter(r => r.value).map((row, i) => (
          <div key={i} className="card-intergo flex items-center justify-between">
            <div className="flex flex-col flex-1 min-w-0 pr-4">
              <span className="text-label text-secondary">{row.label}</span>
              <span className="text-body font-medium truncate">{String(row.value)}</span>
            </div>
          </div>
        ))}
        
        <div className="card-intergo bg-primary/5 border border-primary/10">
          <p className="text-label text-primary mb-1">SERÁ APROVADO POR</p>
          <p className="text-body font-bold text-primary">{superiorName}</p>
        </div>

        {error && (
          <div className="p-4 bg-error/10 text-error rounded-2xl text-sm flex items-start gap-3">
            <Loader2 className="shrink-0 mt-0.5" size={16} />
            {error}
          </div>
        )}
      </div>

      <div className="fixed bottom-8 left-5 right-5 space-y-3">
        <p className="text-[12px] text-secondary text-center px-4">
          Ao clicar em enviar, você concorda com os termos de uso e política de privacidade.
        </p>
        <button 
          onClick={handleFinish} 
          disabled={loading}
          className="btn-primary"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Confirmar e Enviar'}
        </button>
      </div>
    </div>
  );
};
