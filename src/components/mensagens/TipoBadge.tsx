import React from 'react'
import { cn } from '@/lib/utils'
import { tipoMeta } from '@/lib/mensagens'

export interface TipoBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tipo: string
}

export const TipoBadge: React.FC<TipoBadgeProps> = ({ tipo, className, ...rest }) => {
  const meta = tipoMeta(tipo)
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center rounded-md px-2 py-[2px] text-[11px] font-semibold uppercase tracking-wide',
        className,
      )}
      style={{ backgroundColor: meta.bg, color: meta.fg }}
    >
      {meta.label}
    </span>
  )
}
