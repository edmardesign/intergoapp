import { Link, useLocation } from '@tanstack/react-router';
import { Home, Send, Package, Users, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const BottomNavigation = () => {
  const location = useLocation();
  const [showEquipe, setShowEquipe] = useState(false);
  const [showEnviar, setShowEnviar] = useState(false);

  useEffect(() => {
    const checkPerms = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('perfis')
        .select('*, cargo:nivel_id(*)')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        // Show Equipe if has subordinates or is Secretary/Mayor
        const hasSubordinates = !!profile.superior_id; // Simple check for now, ideally check if others have profile.id as superior
        setShowEquipe(profile.cargo?.nome === 'Secretário de Educação' || profile.cargo?.nome === 'Prefeito' || hasSubordinates);
        setShowEnviar(!!(profile.cargo as any)?.pode_enviar_descendente);
      }
    };
    checkPerms();
  }, []);

  const navItems = [
    { to: '/inicio', icon: Home, label: 'Início' },
    ...(showEnviar ? [{ to: '/enviar', icon: Send, label: 'Enviar' }] : []),
    { to: '/pedidos', icon: Package, label: 'Pedidos' },
    ...(showEquipe ? [{ to: '/equipe', icon: Users, label: 'Equipe' }] : []),
    { to: '/perfil', icon: User, label: 'Perfil' },
  ];

  // Don't show on onboarding or login
  const hidePaths = ['/onboarding', '/login', '/auth'];
  if (hidePaths.some(p => location.pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-border px-2 pb-safe z-40">
      <div className="flex items-center justify-around h-[56px] max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to as any}
              className={`flex flex-col items-center justify-center w-16 transition-all ${isActive ? 'text-primary' : 'text-secondary'}`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
