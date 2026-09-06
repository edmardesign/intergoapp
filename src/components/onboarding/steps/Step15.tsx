import React, { useEffect, useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { translateAuthError } from '@/lib/auth-errors';

export const Step15: React.FC = () => {
  const { data, clear } = useOnboardingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('intergo_onboarding_draft', JSON.stringify(data));
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
            superior_id: null,
            funcao: data.funcao || null,
            // MVP: cadastro liberado automaticamente; o admin bloqueia depois no painel.
            status: 'ativo',
          });

        if (profileError) throw profileError;

        if (data.unidades_ids && data.unidades_ids.length > 0) {
          for (let i = 0; i < data.unidades_ids.length; i++) {
            const { error: lotacaoError } = await (supabase as any).rpc('criar_lotacao_inicial', {
              p_perfil_id: authData.user.id,
              p_unidade_id: data.unidades_ids[i],
              p_principal: i === 0,
            });
            if (lotacaoError) throw lotacaoError;
          }
        }

        localStorage.removeItem('intergo_onboarding_draft');
        clear();
        navigate({ to: '/inicio' } as any);
      }
    } catch (err: unknown) {
      setError(translateAuthError(err));
      setLoading(false);
    }
  };

  const rows = [
    { label: 'Nome', value: data.nome_completo },
    { label: 'Função', value: data.funcao },
    { label: 'Secretaria', value: data.secretaria_nome },
    { label: 'CPF', value: data.cpf },
    { label: 'E-mail', value: data.email },
  ];

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-5 duration-300 pb-40">
      <h2 className="text-question mb-2">Tudo pronto!</h2>
      <p className="text-body-secondary mb-6">Confira seus dados antes de enviar.</p>

      <div className="space-y-3">
        {rows.filter((r) => r.value).map((row, i) => (
          <div key={i} className="card-intergo flex items-center justify-between">
            <div className="flex flex-col flex-1 min-w-0 pr-4">
              <span className="text-label text-secondary">{row.label}</span>
              <span className="text-body font-medium truncate">{String(row.value)}</span>
            </div>
          </div>
        ))}

        <div className="card-intergo bg-primary/5 border border-primary/10">
          <p className="text-body font-semibold text-primary">Seu cadastro está em análise.</p>
        </div>

        {error && (
          <div className="p-4 bg-error/10 text-error rounded-2xl text-sm">{error}</div>
        )}
      </div>

      <div className="fixed bottom-8 left-5 right-5 space-y-3">
        <p className="text-[12px] text-secondary text-center px-4">
          Ao concluir, você concorda com os termos de uso e política de privacidade.
        </p>
        <button onClick={handleFinish} disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Concluir'}
        </button>
      </div>
    </div>
  );
};
