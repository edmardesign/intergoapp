import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SendFlowLayout } from "@/components/enviar/SendFlowLayout";
import { useEnviarStore, MensagemTipo } from "@/lib/enviar-store";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/enviar/$tipo/")({
  component: PreencherPage,
});

function CharCounter({ current, max }: { current: number; max: number }) {
  const percentage = (current / max) * 100;
  let colorClass = "text-[#AEAEB2]"; // cinza
  if (percentage > 100) colorClass = "text-[#FF3B30]"; // vermelho
  else if (percentage >= 80) colorClass = "text-[#FF9F0A]"; // âmbar

  return (
    <div className={`text-[12px] text-right mt-1 ${colorClass}`}>
      {current}/{max}
    </div>
  );
}

function PreencherPage() {
  const { tipo } = Route.useParams() as { tipo: MensagemTipo };
  const navigate = useNavigate();
  const { drafts, updatePayload, updateDraft } = useEnviarStore();
  const draft = drafts[tipo];

  const [localPayload, setLocalPayload] = useState(draft?.payload || {});
  const [exigirConfirmacao, setExigirConfirmacao] = useState(draft?.exigir_confirmacao || false);
  const [urgente, setUrgente] = useState(draft?.urgente || false);

  useEffect(() => {
    if (draft) {
      setLocalPayload(draft.payload);
      setExigirConfirmacao(draft.exigir_confirmacao);
      setUrgente(draft.urgente);
    }
  }, [tipo, draft]);

  const update = (key: string, value: string) => {
    const newPayload = { ...localPayload, [key]: value };
    setLocalPayload(newPayload);
    updatePayload(tipo, { [key]: value });
  };

  const isFormValid = () => {
    const limits: any = {
      assunto: 60,
      corpo: 300,
      o_que_precisa: 400,
      local_evento: 120,
      pauta: 250,
      titulo: 60,
      descricao: 250
    };

    const checkLimits = () => {
      for (const [key, value] of Object.entries(localPayload)) {
        if (limits[key] && (value as string).length > limits[key]) return false;
      }
      return true;
    };

    if (!checkLimits()) return false;

    if (tipo === 'comunicado') return !!localPayload.assunto && !!localPayload.corpo;
    if (tipo === 'demanda') return !!localPayload.assunto && !!localPayload.o_que_precisa && !!localPayload.prazo;
    if (tipo === 'reuniao') return !!localPayload.assunto && !!localPayload.data_evento && !!localPayload.hora_evento && !!localPayload.local_evento;
    if (tipo === 'evento') return !!localPayload.titulo && !!localPayload.data_evento && !!localPayload.hora_evento && !!localPayload.local_evento;
    return false;
  };

  return (
    <SendFlowLayout 
      step={1} 
      title="Preencher"
      footer={
        <button 
          onClick={() => navigate({ to: `/enviar/${tipo}/destinatarios` })}
          disabled={!isFormValid()}
          className="btn-primary"
        >
          Continuar
        </button>
      }
    >
      <div className="space-y-6">
        {tipo === 'comunicado' && (
          <>
            <div>
              <input 
                className="input-field"
                placeholder="Assunto (máx 60)"
                value={localPayload.assunto || ''}
                onChange={(e) => update('assunto', e.target.value)}
              />
              <CharCounter current={localPayload.assunto?.length || 0} max={60} />
            </div>
            <div>
              <textarea 
                className="input-field h-[160px] py-4"
                placeholder="Corpo da mensagem (máx 300)"
                value={localPayload.corpo || ''}
                onChange={(e) => update('corpo', e.target.value)}
              />
              <CharCounter current={localPayload.corpo?.length || 0} max={300} />
            </div>
          </>
        )}

        {tipo === 'demanda' && (
          <>
            <div>
              <input 
                className="input-field"
                placeholder="Assunto (máx 60)"
                value={localPayload.assunto || ''}
                onChange={(e) => update('assunto', e.target.value)}
              />
              <CharCounter current={localPayload.assunto?.length || 0} max={60} />
            </div>
            <div>
              <textarea 
                className="input-field h-[160px] py-4"
                placeholder="O que precisa ser feito? (máx 400)"
                value={localPayload.o_que_precisa || ''}
                onChange={(e) => update('o_que_precisa', e.target.value)}
              />
              <CharCounter current={localPayload.o_que_precisa?.length || 0} max={400} />
            </div>
            <div>
              <Label className="text-label text-secondary mb-2 block">Prazo</Label>
              <input 
                type="date"
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
                value={localPayload.prazo || ''}
                onChange={(e) => update('prazo', e.target.value)}
              />
            </div>
          </>
        )}

        {tipo === 'reuniao' && (
          <>
            <input 
              className="input-field"
              placeholder="Assunto da reunião (máx 60)"
              value={localPayload.assunto || ''}
              onChange={(e) => update('assunto', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="date"
                className="input-field"
                value={localPayload.data_evento || ''}
                onChange={(e) => update('data_evento', e.target.value)}
              />
              <input 
                type="time"
                className="input-field"
                value={localPayload.hora_evento || ''}
                onChange={(e) => update('hora_evento', e.target.value)}
              />
            </div>
            <input 
              className="input-field"
              placeholder="Local ou Link (máx 120)"
              value={localPayload.local_evento || ''}
              onChange={(e) => update('local_evento', e.target.value)}
            />
            <textarea 
              className="input-field h-[120px] py-4"
              placeholder="Pauta (máx 250)"
              value={localPayload.pauta || ''}
              onChange={(e) => update('pauta', e.target.value)}
            />
          </>
        )}

        {tipo === 'evento' && (
          <>
            <input 
              className="input-field"
              placeholder="Título do evento (máx 60)"
              value={localPayload.titulo || ''}
              onChange={(e) => update('titulo', e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="date"
                className="input-field"
                value={localPayload.data_evento || ''}
                onChange={(e) => update('data_evento', e.target.value)}
              />
              <input 
                type="time"
                className="input-field"
                value={localPayload.hora_evento || ''}
                onChange={(e) => update('hora_evento', e.target.value)}
              />
            </div>
            <input 
              className="input-field"
              placeholder="Local (máx 120)"
              value={localPayload.local_evento || ''}
              onChange={(e) => update('local_evento', e.target.value)}
            />
            <textarea 
              className="input-field h-[120px] py-4"
              placeholder="Descrição (máx 250)"
              value={localPayload.descricao || ''}
              onChange={(e) => update('descricao', e.target.value)}
            />
          </>
        )}


        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <Label htmlFor="confirmacao" className="text-body font-medium">Exigir confirmação de recebimento</Label>
            <Switch 
              id="confirmacao" 
              checked={exigirConfirmacao}
              onCheckedChange={(val) => {
                setExigirConfirmacao(val);
                updateDraft(tipo, { exigir_confirmacao: val });
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="urgente" className="text-body font-medium">Marcar como urgente</Label>
            <Switch 
              id="urgente" 
              checked={urgente}
              onCheckedChange={(val) => {
                setUrgente(val);
                updateDraft(tipo, { urgente: val });
              }}
            />
          </div>
        </div>
      </div>
    </SendFlowLayout>
  );
}
