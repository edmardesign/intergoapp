import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SendFlowLayout } from "@/components/enviar/SendFlowLayout";
import { useEnviarStore } from "@/lib/enviar-store";
import { useState } from "react";

export const Route = createFileRoute("/enviar/$tipo/")({
  component: PreencherPage,
});

function PreencherPage() {
  const { tipo } = Route.useParams();
  const navigate = useNavigate();
  const { drafts, updatePayload } = useEnviarStore();
  const draft = drafts[tipo as keyof typeof drafts];

  if (!draft) return null;

  const [localPayload, setLocalPayload] = useState(draft.payload);

  const update = (key: string, value: string) => {
    const newPayload = { ...localPayload, [key]: value };
    setLocalPayload(newPayload);
    updatePayload(tipo as any, { [key]: value });
  };

  return (
    <SendFlowLayout 
      step={1} 
      title="Preencher"
      footer={
        <button 
          onClick={() => navigate({ to: `/enviar/${tipo}/destinatarios` })}
          className="btn-primary"
        >
          Continuar
        </button>
      }
    >
      <div className="space-y-4">
        {tipo === 'comunicado' && (
          <>
            <input 
              className="input-field"
              placeholder="Assunto (máx 60)"
              value={localPayload.assunto || ''}
              onChange={(e) => update('assunto', e.target.value)}
            />
            <textarea 
              className="input-field h-[120px] p-4"
              placeholder="Corpo da mensagem (máx 300)"
              value={localPayload.corpo || ''}
              onChange={(e) => update('corpo', e.target.value)}
            />
          </>
        )}
        {/* Adicione os outros tipos conforme necessário */}
      </div>
    </SendFlowLayout>
  );
}
