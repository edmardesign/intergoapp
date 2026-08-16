import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/enviar/sucesso")({
  component: SucessoPage,
});

function SucessoPage() {
  const navigate = useNavigate();
  const search = Route.useSearch() as { n: number };

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-background items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 size={48} strokeWidth={1.5} />
      </div>
      
      <h1 className="text-[28px] font-bold mb-3">Mensagem enviada!</h1>
      
      <p className="text-body text-secondary max-w-[280px] mb-12">
        Sua mensagem foi entregue para {search.n || 'todas as'} pessoas selecionadas.
      </p>
      
      <div className="card-intergo p-5 bg-muted/30 border border-border w-full text-left flex items-center">
        <div className="flex-1">
          <p className="text-body font-semibold">Acompanhe as confirmações</p>
          <p className="text-[13px] text-secondary mt-1">Veja quem leu em Início / Enviadas.</p>
        </div>
        <ChevronRight size={20} className="text-secondary" />
      </div>

      <div className="fixed bottom-32 left-6 right-6">
        <button 
          onClick={() => navigate({ to: '/inicio' })}
          className="btn-primary"
        >
          Voltar para o Início
        </button>
      </div>
    </div>
  );
}
