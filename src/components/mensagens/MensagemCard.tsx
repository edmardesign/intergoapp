import React from 'react'
import { cn } from '@/lib/utils'
import { TipoBadge } from './TipoBadge'
import {
  assuntoDe,
  corpoDe,
  tempoRelativo,
  type Mensagem,
  type PessoaMin,
} from '@/lib/mensagens'

export interface MensagemCardProps {
  mensagem: Mensagem
  remetente?: PessoaMin | undefined
  naoLida?: boolean
  saindo?: boolean
  onClick?: () => void
  onConfirmar?: () => void
  confirmando?: boolean
}

export const MensagemCard: React.FC<MensagemCardProps> = ({
  mensagem,
  remetente,
  naoLida = false,
  saindo = false,
  onClick,
  onConfirmar,
  confirmando = false,
}) => {
  const corpo = corpoDe(mensagem)

  return (
    <div
      className={cn(
        'bg-card rounded-2xl p-4 transition-all duration-[250ms] ease-out',
        saindo ? 'opacity-0 scale-95 max-h-0 p-0 overflow-hidden' : 'opacity-100',
      )}
    >
      <button type="button" onClick={onClick} className="w-full text-left active:opacity-70">
        <div className="flex items-center gap-2">
          <TipoBadge tipo={mensagem.tipo} />
          {mensagem.urgente && (
            <span
              className="inline-flex items-center rounded-md px-2 py-[2px] text-[11px] font-semibold uppercase"
              style={{ backgroundColor: '#FFEBEA', color: '#C1272D' }}
            >
              Urgente
            </span>
          )}
        </div>

        <div className="mt-2 flex items-start gap-2">
          {naoLida && (
            <span
              className="mt-[7px] h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: '#1B4F8C' }}
              aria-label="Não lida"
            />
          )}
          <h3 className="text-[17px] leading-[22px] font-semibold text-foreground">
            {assuntoDe(mensagem)}
          </h3>
        </div>

        <p className="mt-1 text-[13px] leading-[18px] text-secondary">
          {remetente?.nome ?? 'Remetente'} · {tempoRelativo(mensagem.created_at)}
        </p>

        {corpo && (
          <p className="mt-2 text-[15px] leading-[20px] text-foreground/80 line-clamp-2">{corpo}</p>
        )}
      </button>

      {onConfirmar && (
        <button
          type="button"
          onClick={onConfirmar}
          disabled={confirmando}
          className="mt-4 h-11 w-full rounded-xl text-[15px] font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
          style={{ backgroundColor: '#E8EFF6', color: '#1B4F8C' }}
        >
          Confirmar recebimento
        </button>
      )}
    </div>
  )
}
