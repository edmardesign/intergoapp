import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Clock, CheckCircle2, XCircle, ArrowRight, Package } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Route = createFileRoute('/pedidos/$id')({
  component: PedidoDetails,
});

function PedidoDetails() {
  const { id } = Route.useParams();

  const { data: pedido, isLoading } = useQuery({
    queryKey: ['solicitacao', id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('solicitacoes')
        .select(`
          *,
          solicitante:solicitante_id(nome_completo),
          responsavel:responsavel_atual_id(nome_completo),
          eventos:solicitacao_eventos(*, autor:autor_id(nome_completo))
        `)
        .eq('id', id)
        .single();
      return data;
    }
  });

  if (isLoading || !pedido) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="p-4 flex items-center bg-white border-b sticky top-0 z-10">
        <button onClick={() => window.history.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="flex-1 text-center font-bold text-lg">Detalhes do Pedido</h1>
        <div className="w-10" />
      </header>

      <main className="p-5 space-y-6">
        <section className="card-intergo">
          <div className="flex items-center justify-between mb-4">
            <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${
              pedido.status === 'pendente' ? 'bg-warning/10 text-warning' : 
              pedido.status === 'aprovado' ? 'bg-success/10 text-success' : 
              'bg-primary/10 text-primary'
            }`}>
              {pedido.status.toUpperCase()}
            </span>
            <span className="text-[12px] text-secondary">
              ID: {pedido.id.substring(0, 8)}
            </span>
          </div>
          
          <h2 className="text-xl font-bold mb-1">{pedido.item}</h2>
          <p className="text-body-secondary mb-4">{pedido.quantidade} {pedido.unidade_medida}</p>
          
          <div className="pt-4 border-t space-y-3">
             <div className="flex justify-between">
               <span className="text-label text-secondary">Solicitante</span>
               <span className="text-body font-medium text-right">{pedido.solicitante?.nome_completo}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-label text-secondary">Responsável Atual</span>
               <span className="text-body font-medium text-right">{pedido.responsavel?.nome_completo}</span>
             </div>
          </div>
        </section>

        <section>
          <h3 className="text-label text-secondary mb-4 ml-1">LINHA DO TEMPO</h3>
          <div className="space-y-0 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {pedido.eventos?.map((evento: any, i: number) => {
               const daysSince = i > 0 ? differenceInDays(new Date(evento.created_at), new Date(pedido.eventos[i-1].created_at)) : 0;
               return (
                 <div key={evento.id} className="relative pl-12 pb-8">
                   <div className={`absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center border-4 border-background z-10 ${
                     evento.acao === 'criou' ? 'bg-primary text-white' : 
                     evento.acao === 'aprovou' ? 'bg-success text-white' : 'bg-white text-secondary border-border'
                   }`}>
                     {evento.acao === 'criou' ? <Package size={16} /> : <CheckCircle2 size={16} />}
                   </div>
                   <div>
                     <p className="text-body font-bold">
                        {evento.acao === 'criou' ? 'Solicitado' : 
                         evento.acao === 'aprovou' ? 'Aprovado' : 
                         evento.acao === 'negou' ? 'Negado' : 'Encaminhado'}
                     </p>
                     <p className="text-label text-secondary">
                        {evento.autor?.nome_completo} • {format(new Date(evento.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                     </p>
                     {daysSince > 0 && <p className="text-[11px] text-warning font-bold mt-1">{daysSince} dias aguardando</p>}
                     {evento.observacao && <p className="mt-2 text-sm text-secondary bg-white p-3 rounded-xl border">{evento.observacao}</p>}
                   </div>
                 </div>
               );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
