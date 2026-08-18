import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { XCircle, LogOut } from 'lucide-react';

export const Route = createFileRoute('/onboarding/negado')({
  component: DeniedAccess,
});

function DeniedAccess() {
  const [motivo, setMotivo] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMotivo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data } = await supabase
        .from('perfis')
        .select('motivo_negativa')
        .eq('id', session.user.id)
        .single();
        
      setMotivo(data?.motivo_negativa || 'O motivo não foi detalhado pelo aprovador.');
    };
    fetchMotivo();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/onboarding' } as any);
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6 bg-background text-center">
      <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mb-6">
        <XCircle size={40} className="text-error" />
      </div>
      
      <h1 className="text-question mb-4">Acesso Negado</h1>
      <p className="text-body text-secondary mb-8">
        Seu cadastro não pôde ser aprovado neste momento.
      </p>
      
      <div className="card-intergo w-full mb-8 border border-error/20">
        <p className="text-label text-error mb-2">MOTIVO DA NEGATIVA</p>
        <p className="text-body font-medium">{motivo}</p>
      </div>
      
      <p className="text-body-secondary mb-12">
        Verifique os dados informados ou entre em contato com sua secretaria para mais informações.
      </p>

      <button 
        onClick={handleLogout}
        className="btn-primary bg-secondary"
      >
        Tentar novamente
      </button>
    </div>
  );
}
