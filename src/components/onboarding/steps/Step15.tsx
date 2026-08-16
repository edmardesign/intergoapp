import React, { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from '@tanstack/react-router';
import { Edit2, Loader2 } from 'lucide-react';

export const Step15: React.FC = () => {
  const { data, goToStep, clear } = useOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFinish = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 1. Auth SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email!,
        password: data.senha!,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Insert Profile
        const profileInsert: any = {
          id: authData.user.id,
          nome_completo: data.nome_completo!,
          cpf: data.cpf!,
          telefone: data.telefone!,
          cep: data.cep!,
          logradouro: data.logradouro || null,
          numero: data.numero || null,
          complemento: data.complemento || null,
          bairro: data.bairro || null,
          municipio_id: data.municipio_id || null,
          secretaria_id: data.secretaria_id || null,
          nivel_id: data.nivel_id || null,
          unidade_id: data.unidade_id || null,
          superior_id: data.superior_id || null,
          status: 'pendente'
        };

        const { error: profileError } = await supabase
          .from('perfis')
          .insert(profileInsert);

        if (profileError) throw profileError;

        // 3. Clean and Navigate
        clear();
        // @ts-ignore
        navigate({ to: '/onboarding/aguardando' });
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar cadastro');
      setLoading(false);
    }
  };

  const rows = [
    { label: 'Estado', value: data.estado_id, step: 2 },
    { label: 'Cidade', value: data.municipio_id, step: 3 },
    { label: 'Secretaria', value: data.secretaria_id, step: 4 },
    { label: 'Cargo', value: data.nivel_id, step: 5 },
    { label: 'Unidade', value: data.unidade_id, step: 6 },
    { label: 'Superior', value: data.superior_id, step: 7 },
    { label: 'Nome', value: data.nome_completo, step: 8 },
    { label: 'CPF', value: data.cpf, step: 9 },
    { label: 'Telefone', value: data.telefone, step: 10 },
    { label: 'Endereço', value: `${data.logradouro || ''}, ${data.numero || ''}`, step: 11 },
    { label: 'E-mail', value: data.email, step: 13 },
  ];

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <h2 className="text-question mb-6">Confira seus dados</h2>
      
      <div className="space-y-3 mb-32">
        {rows.filter(r => r.value).map((row, i) => (
          <div key={i} className="card-intergo flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-label text-secondary">{row.label}</span>
              <span className="text-body font-medium truncate max-w-[200px]">{String(row.value)}</span>
            </div>
            <button 
              onClick={() => goToStep(row.step)}
              className="p-2 text-primary bg-primary/5 rounded-full"
            >
              <Edit2 size={16} />
            </button>
          </div>
        ))}

        {error && (
          <div className="p-4 bg-error/10 text-error rounded-[16px] text-label text-center">
            {error}
          </div>
        )}
      </div>

      <div className="fixed bottom-8 left-5 right-5">
        <button 
          onClick={handleFinish} 
          disabled={loading}
          className="btn-primary"
        >
          {loading ? <Loader2 className="animate-spin" /> : 'Enviar cadastro'}
        </button>
      </div>
    </div>
  );
};
