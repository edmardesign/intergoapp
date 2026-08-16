import React from "react";
import { cn } from "@/lib/utils";

export interface BarraCumprimentoProps {
  /** Percentual de 0 a 100. */
  percentual: number;
  className?: string;
}

/** Retorna a cor de preenchimento conforme a faixa do percentual. */
export function corCumprimento(percentual: number): string {
  if (percentual >= 80) return "#34C759";
  if (percentual >= 50) return "#FF9F0A";
  return "#FF3B30";
}

export const BarraCumprimento: React.FC<BarraCumprimentoProps> = ({ percentual, className }) => {
  const valor = Number.isFinite(percentual) ? Math.min(100, Math.max(0, percentual)) : 0;

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-[4px] bg-[#E5E5EA]", className)}
      role="progressbar"
      aria-valuenow={valor}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-[4px] transition-[width] duration-500"
        style={{ width: `${valor}%`, backgroundColor: corCumprimento(valor) }}
      />
    </div>
  );
};
