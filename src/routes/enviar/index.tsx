import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Megaphone, ListChecks, Users, Calendar, UserRoundPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/enviar/")({
  component: EnviarTipoPage,
});

function EnviarTipoPage() {
  const navigate = useNavigate();
  const [subordinados, setSubordinados] = useState<number | null>(null);

  useEffect(() => {
    const carregarSubordinados = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubordinados(0);
        return;
      }

      const { count } = await supabase
        .from('perfis')
        .select('id', { count: 'exact', head: true })
        .eq('superior_id', session.user.id);
      setSubordinados(count ?? 0);
    };
    carregarSubordinados();
  }, []);

  if (subordinados === null) return null;

  if (subordinados === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-8 text-center">
        <UserRoundPlus className="mb-4 text-primary" size={44} strokeWidth={1.5} />
        <h1 className="text-screen-title mb-2">Enviar</h1>
        <p className="text-body-secondary text-secondary max-w-sm">
          Você ainda não tem subordinados. Quando pessoas se cadastrarem sob sua chefia, elas aparecerão aqui.
        </p>
      </div>
    );
  }

  const tipos = [
    { id: 'comunicado', title: 'Comunicado', desc: 'Informar algo sem prazo', icon: Megaphone },
    { id: 'demanda', title: 'Demanda', desc: 'Pedir uma ação com prazo', icon: ListChecks },
    { id: 'reuniao', title: 'Reunião', desc: 'Marcar encontro presencial ou remoto', icon: Users },
    { id: 'evento', title: 'Evento', desc: 'Convocar para atividade com data', icon: Calendar },
  ];

  return (
    <div className="p-6">
      <h1 className="text-screen-title mb-6">O que você vai enviar?</h1>
      <button
        onClick={() => navigate({ to: '/enviar/mensagem' })}
        className="w-full mb-4 card-intergo flex items-center justify-between p-4 border border-primary/20 bg-primary/5 active:scale-[0.98] transition-transform"
      >
        <span className="text-left">
          <span className="block text-body font-semibold text-primary">Mensagem rápida</span>
          <span className="block text-body-secondary text-secondary">
            Texto e imagem para a sua equipe direta
          </span>
        </span>
      </button>
      <div className="space-y-4">
        {tipos.map((tipo) => (
          <button
            key={tipo.id}
            onClick={() => navigate({ to: `/enviar/${tipo.id}` })}
            className="w-full h-[88px] card-intergo flex items-center p-4 border border-border active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mr-4">
              <tipo.icon size={32} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-body font-semibold">{tipo.title}</span>
              <span className="text-body-secondary text-secondary">{tipo.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
