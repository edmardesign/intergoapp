import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Bell, CheckCircle2, ChevronRight, Inbox, LayoutDashboard, Package, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/inicio/')({
  component: InicioPage,
});

function InicioPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: '/onboarding' } as any);
        return;
      }

      const { data } = await supabase
        .from('perfis')
        .select('*, cargo:nivel_id(*)')
        .eq('id', session.user.id)
        .single();

      if (!data || data.status !== 'ativo') {
        navigate({ to: '/' } as any);
        return;
      }
      setProfile(data);
    };
    checkProfile();
  }, [navigate]);

  const { data: mensagens } = useQuery({
    queryKey: ['mensagens-recebidas'],
    queryFn: async () => {
      const { data } = await supabase
        .from('mensagem_destinatarios')
        .select('*, mensagem:mensagem_id(*, remetente:remetente_id(*))')
        .eq('destinatario_id', (await supabase.auth.getUser()).data.user?.id)
        .order('confirmado_em', { ascending: true }); // Prioritize unconfirmed
      return data || [];
    },
    enabled: !!profile
  });

  if (!profile) return null;

  const mensagensUrgentes = mensagens?.filter(m => m.mensagem.urgente && !m.confirmado_em) || [];
  const mensagensHoje = mensagens?.filter(m => {
    const dataMsg = new Date(m.mensagem.created_at);
    const hoje = new Date();
    return dataMsg.toDateString() === hoje.toDateString();
  }) || [];
  const mensagensAnteriores = mensagens?.filter(m => {
    const dataMsg = new Date(m.mensagem.created_at);
    const hoje = new Date();
    return dataMsg.toDateString() !== hoje.toDateString();
  }) || [];

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 animate-in fade-in duration-300">
      {/* Urgent Header */}
      {mensagensUrgentes.length > 0 && (
        <div className="bg-urgent-bg p-4 flex items-center justify-between border-b border-urgent-text/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-urgent-text" size={20} />
            <span className="text-urgent-text font-bold text-body">
              {mensagensUrgentes.length} {mensagensUrgentes.length === 1 ? 'mensagem urgente' : 'mensagens urgentes'}
            </span>
          </div>
          <button className="text-urgent-text font-bold text-body">Ver tudo</button>
        </div>
      )}

      {/* Hero Header */}
      <header className="p-6 pt-12">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-screen-title">Olá, {profile.nome_completo.split(' ')[0]}</h1>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-primary font-bold">
            {profile.nome_completo.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
        </div>
        <p className="text-body-secondary">
          {profile.cargo?.nome}{profile.funcao ? ` • ${profile.funcao}` : ''}
        </p>
      </header>

      <main className="px-5 space-y-6">
        {/* Urgent Actions */}
        {mensagensUrgentes.map((m) => (
          <div key={m.mensagem_id} className="card-intergo border-l-4 border-urgent-text">
            <div className="flex items-start justify-between mb-2">
              <span className="text-label text-urgent-text font-bold">URGENTE</span>
              <span className="text-[12px] text-secondary">
                {format(new Date(m.mensagem.created_at), "HH:mm", { locale: ptBR })}
              </span>
            </div>
            <h3 className="text-body font-bold mb-1">{(m.mensagem.payload as any).assunto}</h3>
            <p className="text-body-secondary text-sm mb-4 line-clamp-2">{(m.mensagem.payload as any).corpo}</p>
            <button className="btn-primary h-[40px] text-sm">Confirmar recebimento</button>
          </div>
        ))}

        {/* Recebidas Hoje */}
        <section>
          <h2 className="text-label text-secondary mb-3">Recebidas hoje</h2>
          {mensagensHoje.length === 0 ? (
            <div className="card-intergo flex flex-col items-center justify-center py-10 opacity-60">
              <Inbox size={48} className="text-muted-foreground mb-4" />
              <p className="text-body-secondary">Nenhuma mensagem hoje</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mensagensHoje.map(m => (
                <div key={m.mensagem_id} className="card-intergo flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-body font-medium truncate">{(m.mensagem.payload as any).assunto}</p>
                    <p className="text-label text-secondary truncate">{m.mensagem.remetente?.nome_completo}</p>
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Dashboards for specific roles */}
        {(profile.cargo?.nome === 'Prefeito' || profile.cargo?.nome === 'Secretário de Educação') && (
          <section>
            <h2 className="text-label text-secondary mb-3">Gestão</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="card-intergo">
                <Users className="text-primary mb-2" size={24} />
                <p className="text-2xl font-bold">12</p>
                <p className="text-[12px] text-secondary">Pendentes</p>
              </div>
              <div className="card-intergo">
                <Package className="text-primary mb-2" size={24} />
                <p className="text-2xl font-bold">8</p>
                <p className="text-[12px] text-secondary">Pedidos</p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
