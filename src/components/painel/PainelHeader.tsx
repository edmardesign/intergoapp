import React from "react";
import { RefreshCw, ChevronLeft } from "lucide-react";
import { dataHoraBR } from "./formatadores";

export interface PainelHeaderProps {
  titulo: string;
  subtitulo: string;
  atualizadoEm: string;
  atualizando?: boolean;
  onAtualizar: () => void;
  onVoltar?: () => void;
}

export const PainelHeader: React.FC<PainelHeaderProps> = ({
  titulo,
  subtitulo,
  atualizadoEm,
  atualizando,
  onAtualizar,
  onVoltar,
}) => (
  <header className="mb-6">
    {onVoltar && (
      <button
        type="button"
        onClick={onVoltar}
        className="mb-2 flex items-center gap-1 text-[15px] text-primary"
      >
        <ChevronLeft size={18} strokeWidth={1.5} />
        Voltar
      </button>
    )}
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-[28px] font-bold leading-[34px] text-foreground">{titulo}</h1>
        <p className="mt-0.5 text-[15px] leading-5 text-muted-foreground">{subtitulo}</p>
      </div>
      <button
        type="button"
        onClick={onAtualizar}
        disabled={atualizando}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-card px-3 py-2 text-[13px] font-medium text-primary shadow-[0_1px_3px_rgba(0,0,0,0.06)] disabled:opacity-50"
      >
        <RefreshCw size={14} strokeWidth={1.5} className={atualizando ? "animate-spin" : ""} />
        Atualizar agora
      </button>
    </div>
    <span className="mt-3 inline-block rounded-full bg-[#E5E5EA] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
      Dados de {dataHoraBR(atualizadoEm)}
    </span>
  </header>
);
