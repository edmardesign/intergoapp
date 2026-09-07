import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/equipe/$perfilId')({
  component: DetalhePessoa,
});

function dataCurta(v?: string | null) {
  if (!v) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(v));
}

function DetalhePessoa() {
  const { perfilId } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pessoa, setPessoa] = useState<any>(null);
  const [recebidas, setRecebidas] = useState<any[]>([]);
  const [enviadas, setEnviadas] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);

  useEffect(() => {
    const carregar = async () => {
      const [{ data: p }, { data: rec }, { data: env }, { data: sol }] = await Promise.all([
        (supabase as any).from('perfis').select('id, nome_completo, cargo:nivel_id(nome)').eq('id', perfilId).maybeSingle(),
        (supabase as any)
          .from('mensagem_destinatarios')
          .select('lido_em, mensagem:mensagem_id(id, payload, created_at)')
          .eq('destinatario_id', perfilId),
        (supabase as any)
          .from('mensagens')
          .select('id, payload, created_at')
          .eq('remetente_id', perfilId)
          .order('created_at', { ascending: false }),
        (supabase as any)
          .from('solicitacoes')
          .select('id, item, quantidade, status, created_at')
          .eq('solicitante_id', perfilId)
          .order('created_at', { ascending: false }),
      ]);
      setPessoa(p);
      setRecebidas(rec ?? []);
      setEnviadas(env ?? []);
      setPedidos(sol ?? []);
      setLoading(false);
    };
    carregar();
  }, [perfilId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-24 pt-6">
      <button
        type="button"
        onClick={() => navigate({ to: '/equipe' })}
        className="mb-4 flex items-center gap-1 text-[15px] font-medium text-primary active:opacity-60"
      >
        <ArrowLeft size={18} /> Equipe
      </button>

      <h1 className="text-[28px] font-bold leading-[34px]">{pessoa?.nome_completo ?? 'Pessoa'}</h1>
      <p className="mb-6 text-[13px] text-secondary">{pessoa?.cargo?.nome ?? ''}</p>

      <section className="mb-6">
        <h2 className="mb-2 text-[13px] font-semibold uppercase text-secondary">Mensagens recebidas</h2>
        {recebidas.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-[15px] text-secondary">Nenhuma mensagem recebida.</p>
        ) : (
          <div className="space-y-2">
            {recebidas.map((r, i) => (
              <div key={i} className="rounded-2xl bg-card p-4">
                <p className="text-[15px] font-medium">{r.mensagem?.payload?.assunto ?? 'Mensagem'}</p>
                <p className="text-[13px] text-secondary">
                  {r.lido_em ? `Lida em ${dataCurta(r.lido_em)}` : 'Não lida'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-[13px] font-semibold uppercase text-secondary">Mensagens enviadas</h2>
        {enviadas.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-[15px] text-secondary">Nenhuma mensagem enviada.</p>
        ) : (
          <div className="space-y-2">
            {enviadas.map((m) => (
              <div key={m.id} className="rounded-2xl bg-card p-4">
                <p className="text-[15px] font-medium">{m.payload?.assunto ?? 'Mensagem'}</p>
                <p className="text-[13px] text-secondary">{dataCurta(m.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold uppercase text-secondary">Pedidos feitos</h2>
        {pedidos.length === 0 ? (
          <p className="rounded-2xl bg-card p-4 text-[15px] text-secondary">Nenhum pedido.</p>
        ) : (
          <div className="space-y-2">
            {pedidos.map((s) => (
              <div key={s.id} className="rounded-2xl bg-card p-4">
                <p className="text-[15px] font-medium">
                  {s.item} · {s.quantidade}
                </p>
                <p className="text-[13px] text-secondary">
                  {s.status} · {dataCurta(s.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
