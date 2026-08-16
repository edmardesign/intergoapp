import React from 'react'
import { STATUS_META, type SolicitacaoStatus } from '@/lib/pedidos'

interface StatusSeloProps {
  status: SolicitacaoStatus
}

export const StatusSelo: React.FC<StatusSeloProps> = ({ status }) => {
  const meta = STATUS_META[status] ?? STATUS_META.solicitado
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.cor }}
        aria-hidden
      />
      <span className="text-[11px] font-semibold uppercase tracking-wide text-secondary">
        {meta.label}
      </span>
    </span>
  )
}
