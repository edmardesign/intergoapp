import React, { useEffect, useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Home, Send, ClipboardList, Users, User, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Tab {
  label: string;
  icon: LucideIcon;
  to: string;
}

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('perfis')
        .select('nivel:nivel_id(nome)')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setRole((profile as any).nivel?.nome || '');
      }
      setLoading(false);
    };
    fetchRole();
  }, []);

  if (loading) return null;

  const isProfessor = role?.toLowerCase().includes('professor');
  
  const tabs: Tab[] = isProfessor 
    ? [
        { label: 'Início', icon: Home, to: '/inicio' },
        { label: 'Pedidos', icon: ClipboardList, to: '/pedidos' },
        { label: 'Perfil', icon: User, to: '/perfil' },
      ]
    : [
        { label: 'Início', icon: Home, to: '/inicio' },
        { label: 'Enviar', icon: Send, to: '/enviar' },
        { label: 'Pedidos', icon: ClipboardList, to: '/pedidos' },
        { label: 'Equipe', icon: Users, to: '/equipe' },
        { label: 'Perfil', icon: User, to: '/perfil' },
      ];

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
