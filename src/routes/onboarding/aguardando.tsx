import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Loader2, LogOut } from 'lucide-react';

export const Route = createFileRoute('/onboarding/aguardando')({
  component: WaitingApproval,
});

function WaitingApproval() {
  const [aprovador, setAprovador] = useState<string>('Direção Central');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: '/onboarding' } as any);
        return;
      }

      const { data: profile } = await supabase
        .from('perfis')
        .select('status, superior_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.status === 'ativo') {
        navigate({ to: '/inicio' } as any);
        return;
      }

      if (profile?.status === 'negado') {
        navigate({ to: '/onboarding/negado' } as any);
        return;
      }

      // Get Approver Name via RPC
      const { data: nome, error } = await supabase.rpc('get_nome_aprovador', { 
        perfil_uuid: session.user.id 
      });
      
      if (!error && nome) {
        setAprovador(nome);
      }
      setLoading(false);
    };

    checkStatus();
    
    // Polling status
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/onboarding' } as any);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6 bg-background text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 size={40} className="text-primary" />
      </div>
      
      <h1 className="text-question mb-4">Quase lá!</h1>
      <p className="text-body text-secondary mb-8">
        Seu cadastro está em análise.
      </p>

      <p className="text-body-secondary mb-12">
        Você receberá uma notificação assim que seu acesso for liberado.
      </p>

      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 text-secondary text-body font-medium"
      >
        <LogOut size={18} />
        Sair da conta
      </button>
    </div>
  );
}
