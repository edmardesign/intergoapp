import React from 'react'
import { Check, CornerUpRight, Plus, PackageCheck, X, type LucideIcon } from 'lucide-react'
import { ACAO_META, type PessoaMin, type SolicitacaoAcao, type SolicitacaoEvento } from '@/lib/pedidos'
import { dataCurta, horaCurta } from '@/lib/mensagens'

const ICONES: Record<SolicitacaoAcao, LucideIcon> = {
  criou: Plus,
  encaminhou: CornerUpRight,
  aprovou: Check,
  negou: X,
  entregou: PackageCheck,
}

interface TimelineProps {
  eventos: SolicitacaoEvento[]
  diretorio: Map<string, PessoaMin>
}

export const Timeline: React.FC<TimelineProps> = ({ eventos, diretorio }) => {
  return (
    <ol className="relative">
      {eventos.map((ev, i) => {
        const meta = ACAO_META[ev.acao] ?? ACAO_META.criou
        const Icone = ICONES[ev.acao] ?? Plus
        const autor = diretorio.get(ev.autor_id)
        const ultimo = i === eventos.length - 1

        return (
          <li key={ev.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!ultimo && (
              <span
                className="absolute left-[11px] top-6 bottom-0 w-px"
                style={{ backgroundColor: '#E5E5EA' }}
                aria-hidden
              />
            )}

            <span
              className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: meta.cor }}
            >
              <Icone size={13} strokeWidth={2} className="text-white" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-foreground">
                {meta.label} — {autor?.nome ?? 'Usuário'}
                {autor?.cargo ? ` (${autor.cargo})` : ''}
              </p>
              {ev.observacao && (
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-[19px] text-secondary">
                  {ev.observacao}
                </p>
              )}
              <p className="mt-1 text-[13px] text-secondary">
                {dataCurta(ev.created_at)} às {horaCurta(ev.created_at)}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
