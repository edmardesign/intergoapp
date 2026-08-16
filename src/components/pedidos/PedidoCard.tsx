import React from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { StatusSelo } from '@/components/pedidos/StatusSelo'
import {
  quantidadeFormatada,
  tempoRelativo,
  type PessoaMin,
  type Solicitacao,
} from '@/lib/pedidos'

interface PedidoCardProps {
  pedido: Solicitacao
  solicitante?: PessoaMin | undefined
  responsavel?: PessoaMin | undefined
  /** Mostra a dica "Está com: fulano" (usado na aba Minhas). */
  mostrarResponsavel?: boolean
}

export const PedidoCard: React.FC<PedidoCardProps> = ({
  pedido,
  solicitante,
  responsavel,
  mostrarResponsavel = false,
}) => {
  const emAndamento = pedido.status === 'solicitado' || pedido.status === 'em_analise'

  return (
    <Link
      to="/pedidos/$id"
      params={{ id: pedido.id }}
      className="flex items-center gap-3 rounded-2xl bg-card p-4 transition-colors active:bg-muted"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <StatusSelo status={pedido.status} />
          {pedido.urgencia === 'urgente' && (
            <span className="rounded-md bg-[#FF3B30] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Urgente
            </span>
          )}
        </div>

        <p className="truncate text-[16px] font-semibold text-foreground">
          {pedido.item} · {quantidadeFormatada(pedido.quantidade, pedido.unidade_medida)}
        </p>

        <p className="mt-0.5 truncate text-[13px] text-secondary">
          {[solicitante?.nome, solicitante?.unidade, tempoRelativo(pedido.created_at)]
            .filter(Boolean)
            .join(' · ')}
        </p>

        {mostrarResponsavel && emAndamento && responsavel && (
          <p className="mt-1 truncate text-[13px] text-secondary">
            Está com: {responsavel.nome}
            {responsavel.cargo ? ` (${responsavel.cargo})` : ''} {tempoRelativo(pedido.updated_at)}
          </p>
        )}
      </div>

      <ChevronRight size={18} className="shrink-0 text-secondary" strokeWidth={1.5} />
    </Link>
  )
}
