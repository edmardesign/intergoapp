import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Shield, Info, ChevronRight } from 'lucide-react';

export const Route = createFileRoute('/perfil/')({
  component: PerfilPage,
});

function PerfilPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data } = await supabase
        .from('perfis')
        .select('*, cargo:nivel_id(*), secretaria:secretaria_id(*)')
        .eq('id', session.user.id)
        .single();
      setProfile(data);
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: '/onboarding' } as any);
  };

  if (!profile) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="p-6 pt-12 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4 text-primary text-2xl font-bold">
          {profile.nome_completo.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
        </div>
        <h1 className="text-xl font-bold">{profile.nome_completo}</h1>
        <p className="text-body-secondary">{profile.cargo?.nome}</p>
      </header>

      <main className="px-5 space-y-4">
        <section className="space-y-2">
          <h2 className="text-label text-secondary ml-1">LOTAÇÃO</h2>
          <div className="card-intergo space-y-4">
             <div className="flex justify-between items-center">
               <span className="text-body-secondary">Secretaria</span>
               <span className="text-body font-medium">{profile.secretaria?.nome}</span>
             </div>
             {profile.funcao && (
               <div className="flex justify-between items-center">
                 <span className="text-body-secondary">Função</span>
                 <span className="text-body font-medium">{profile.funcao}</span>
               </div>
             )}
          </div>
        </section>

        <section className="space-y-2 pt-4">
          <h2 className="text-label text-secondary ml-1">CONTA</h2>
          <div className="card-intergo p-0 overflow-hidden">
            <button className="w-full p-4 flex items-center justify-between border-b active:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-secondary" />
                <span className="text-body">Privacidade e Segurança</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
            <button className="w-full p-4 flex items-center justify-between border-b active:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <Info size={20} className="text-secondary" />
                <span className="text-body">Sobre o INTERGO</span>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
            <button 
              onClick={handleLogout}
              className="w-full p-4 flex items-center gap-3 text-error active:bg-error/5 transition-colors"
            >
              <LogOut size={20} />
              <span className="text-body font-medium">Sair da conta</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
