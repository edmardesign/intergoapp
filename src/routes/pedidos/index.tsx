import { createFileRoute, Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Clock, Package, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/pedidos/')({
  component: PedidosPage,
});

function PedidosPage() {
  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['solicitacoes'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('solicitacoes')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <header className="p-6 pt-12 flex items-center justify-between">
        <h1 className="text-screen-title">Pedidos</h1>
        <Link 
          to="/pedidos/novo"
          className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={24} />
        </Link>
      </header>

      <main className="px-5 space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-24 w-full bg-white rounded-2xl animate-pulse" />
          ))
        ) : pedidos?.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center opacity-60">
            <Package size={64} className="text-muted-foreground mb-4" />
            <p className="text-body font-medium">Nenhum pedido realizado</p>
            <p className="text-sm text-secondary">Toque no + para começar</p>
          </div>
        ) : (
          pedidos?.map((p: any) => (
            <div key={p.id} className="card-intergo flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${
                    p.status === 'pendente' ? 'bg-warning' : 
                    p.status === 'aprovado' ? 'bg-success' : 
                    p.status === 'negado' ? 'bg-error' : 'bg-primary'
                  }`} />
                  <p className="text-body font-bold truncate">{p.item}</p>
                </div>
                <div className="flex items-center gap-3 text-secondary text-[12px]">
                  <span>{p.quantidade} {p.unidade_medida}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {format(new Date(p.created_at), "dd MMM", { locale: ptBR })}
                  </span>
                </div>
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </div>
          ))
        )}
      </main>
    </div>
  );
}
