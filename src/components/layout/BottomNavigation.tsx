import React, { useEffect, useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Home, Send, ClipboardList, Users, User, BarChart3, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { canUserSend } from '@/lib/enviar.functions';

interface Tab {
  label: string;
  icon: LucideIcon;
  to: string;
}

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const [role, setRole] = useState<string | null>(null);
  const [canSend, setCanSend] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerms = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [roleData, sendData] = await Promise.all([
        supabase
          .from('perfis')
          .select('nivel:nivel_id(nome)')
          .eq('id', session.user.id)
          .single(),
        canUserSend()
      ]);

      if (roleData.data) {
        setRole((roleData.data as any).nivel?.nome || '');
      }
      setCanSend(sendData.canSend);
      setLoading(false);
    };
    fetchPerms();
  }, []);

  if (loading) return null;

  const cargo = role?.toLowerCase() ?? '';
  const isProfessor = cargo.includes('professor');
  const isPrefeito = cargo.includes('prefeito');
  const isSecretario = cargo.includes('secret');

  let tabs: Tab[];

  if (isProfessor) {
    tabs = [
      { label: 'Início', icon: Home, to: '/inicio' },
      { label: 'Pedidos', icon: ClipboardList, to: '/pedidos' },
      { label: 'Perfil', icon: User, to: '/perfil' },
    ];
  } else if (isPrefeito) {
    // Prefeito não envia mensagens: a aba "Enviar" dá lugar ao Painel.
    tabs = [
      { label: 'Início', icon: Home, to: '/inicio' },
      { label: 'Painel', icon: BarChart3, to: '/painel' },
      { label: 'Pedidos', icon: ClipboardList, to: '/pedidos' },
      { label: 'Equipe', icon: Users, to: '/equipe' },
      { label: 'Perfil', icon: User, to: '/perfil' },
    ];
  } else if (isSecretario) {
    tabs = [
      { label: 'Início', icon: Home, to: '/inicio' },
      { label: 'Painel', icon: BarChart3, to: '/painel' },
      { label: 'Enviar', icon: Send, to: '/enviar' },
      { label: 'Equipe', icon: Users, to: '/equipe' },
      { label: 'Perfil', icon: User, to: '/perfil' },
    ];
  } else {
    tabs = [
      { label: 'Início', icon: Home, to: '/inicio' },
      { label: 'Enviar', icon: Send, to: '/enviar' },
      { label: 'Pedidos', icon: ClipboardList, to: '/pedidos' },
      { label: 'Equipe', icon: Users, to: '/equipe' },
      { label: 'Perfil', icon: User, to: '/perfil' },
    ];
  }


  // Don't show on onboarding or login
  const hideOn = ['/onboarding', '/login', '/'];
  if (hideOn.some(path => location.pathname.startsWith(path))) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[56px] bg-white border-t border-border shadow-[0_-1px_2px_rgba(0,0,0,0.04)] flex items-center justify-around z-50">
      {tabs.map((tab) => {
        const isActive = location.pathname.startsWith(tab.to);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200",
              isActive ? "text-primary" : "text-[#AEAEB2]"
            )}
          >
            <tab.icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="text-[11px] mt-1 font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
