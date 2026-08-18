import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Megaphone, ListChecks, Users, Calendar } from "lucide-react";

export const Route = createFileRoute("/enviar/")({
  component: EnviarTipoPage,
});

function EnviarTipoPage() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const { canUserSend } = require('@/lib/enviar.functions');
    canUserSend().then((res: any) => {
      setAllowed(res.canSend);
      if (res.canSend === false) {
        navigate({ to: '/inicio' });
      }
    });
  }, [navigate]);

  if (allowed === null) return null;
  if (allowed === false) return null;

  const tipos = [
    { id: 'comunicado', title: 'Comunicado', desc: 'Informar algo sem prazo', icon: Megaphone },
    { id: 'demanda', title: 'Demanda', desc: 'Pedir uma ação com prazo', icon: ListChecks },
    { id: 'reuniao', title: 'Reunião', desc: 'Marcar encontro presencial ou remoto', icon: Users },
    { id: 'evento', title: 'Evento', desc: 'Convocar para atividade com data', icon: Calendar },
  ];

  return (
    <div className="p-6">
      <h1 className="text-screen-title mb-6">O que você vai enviar?</h1>
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
