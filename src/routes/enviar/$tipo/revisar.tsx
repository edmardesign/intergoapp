import React, { useState } from 'react';
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SendFlowLayout } from "@/components/enviar/SendFlowLayout";
import { useEnviarStore, MensagemTipo } from "@/lib/enviar-store";
import { enviarMensagem } from "@/lib/enviar.functions";
import { Megaphone, ListChecks, Users, Calendar, AlertCircle, Loader2, CheckCircle2, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/enviar/$tipo/revisar")({
  component: RevisarPage,
});

function RevisarPage() {
  const { tipo } = Route.useParams() as { tipo: MensagemTipo };
  const navigate = useNavigate();
  const { drafts, clearDraft, updateDraft } = useEnviarStore();
  const draft = drafts[tipo];

  const [enviando, setEnviando] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!draft) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (draft.anexos.length + files.length > 5) {
      toast.error("Máximo de 5 anexos permitidos");
      return;
    }

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Arquivo ${file.name} excede 10MB`);
          continue;
        }

        const path = `${session.user.id}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from('anexos').upload(path, file);

        if (error) throw error;

        updateDraft(tipo, {
          anexos: [...draft.anexos, {
            nome: file.name,
            url: path,
            tamanho: file.size,
            tipo_mime: file.type
          }]
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    setEnviando(true);
    try {
      const result = await enviarMensagem({
        data: {
          tipo,
          payload: draft.payload,
          exigir_confirmacao: draft.exigir_confirmacao,
          urgente: draft.urgente,
          destinatarios: draft.destinatarios,
          anexos: draft.anexos
        }
      });

      if (result.success) {
        clearDraft(tipo);
        navigate({ 
          to: '/enviar/sucesso', 
          search: { n: draft.destinatarios.length } 
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Falha ao enviar mensagem");
    } finally {
      setEnviando(false);
    }
  };

  const Icon = {
    comunicado: Megaphone,
    demanda: ListChecks,
    reuniao: Users,
    evento: Calendar
  }[tipo];

  return (
    <SendFlowLayout 
      step={3} 
      title="Revisão"
      onBack={() => navigate({ to: `/enviar/${tipo}/destinatarios` })}
      footer={
        <button 
          onClick={handleSend}
          disabled={enviando || uploading}
          className="btn-primary"
        >
          {enviando ? <Loader2 className="animate-spin" /> : 'Enviar agora'}
        </button>
      }
    >
      <div className="space-y-6">
        <div className="text-secondary text-[15px]">
          Esta mensagem vai para {draft.destinatarios.length} pessoas.
        </div>

        {/* Card Preview */}
        <div className={cn(
          "card-intergo border-l-4 p-5 shadow-sm",
          draft.urgente ? "border-l-error bg-error/5" : "border-l-primary"
        )}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center text-primary">
              <Icon size={20} className="mr-2" />
              <span className="text-[13px] font-bold uppercase tracking-wider">{tipo}</span>
            </div>
            {draft.urgente && (
              <span className="bg-error text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Urgente</span>
            )}
          </div>

          <h3 className="text-[19px] font-bold mb-2">
            {draft.payload.assunto || draft.payload.titulo}
          </h3>

          <p className="text-body text-foreground/80 line-clamp-3 mb-4">
            {draft.payload.corpo || draft.payload.o_que_precisa || draft.payload.descricao}
          </p>

          {(draft.payload.data || draft.payload.prazo) && (
            <div className="flex items-center text-secondary text-[13px] mt-2">
              <Calendar size={14} className="mr-1" />
              <span>{draft.payload.data || draft.payload.prazo} {draft.payload.hora}</span>
            </div>
          )}
        </div>

        {/* Attachments Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-body font-bold">Anexos</h3>
            <label className="text-primary text-[15px] font-semibold cursor-pointer">
              {uploading ? <Loader2 className="animate-spin" size={18} /> : 'Anexar'}
              <input type="file" className="hidden" multiple onChange={handleFileUpload} />
            </label>
          </div>
          
          <div className="space-y-2">
            {draft.anexos.map((anexo) => (
              <div key={anexo.url} className="flex items-center p-3 bg-white border border-border rounded-xl">
                <Paperclip size={18} className="text-secondary mr-3" />
                <span className="text-[14px] flex-1 truncate">{anexo.nome}</span>
                <button 
                  onClick={() => updateDraft(tipo, { anexos: draft.anexos.filter(a => a.url !== anexo.url) })}
                  className="p-1 text-secondary hover:text-error"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
            {draft.anexos.length === 0 && (
              <p className="text-label text-secondary text-center py-4 italic">Nenhum anexo</p>
            )}
          </div>
        </div>
      </div>
    </SendFlowLayout>
  );
}
