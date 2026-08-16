import React from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  titulo: string;
  valor: React.ReactNode;
  subrotulo?: string;
  variacao?: number | null;
  children?: React.ReactNode;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  titulo,
  valor,
  subrotulo,
  variacao,
  children,
  className,
  ...rest
}) => {
  const subiu = typeof variacao === "number" && variacao >= 0;

  return (
    <div
      className={cn(
        "min-h-[96px] rounded-2xl bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
        className,
      )}
      {...rest}
    >
      <p className="text-[13px] leading-[18px] text-muted-foreground">{titulo}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[28px] font-bold leading-[34px] text-foreground">{valor}</span>
        {typeof variacao === "number" && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-[13px] font-medium",
              subiu ? "text-[#34C759]" : "text-[#FF3B30]",
            )}
          >
            {subiu ? <ArrowUp size={12} strokeWidth={2} /> : <ArrowDown size={12} strokeWidth={2} />}
            {Math.abs(variacao)}%
          </span>
        )}
      </div>
      {subrotulo && (
        <p className="mt-0.5 text-[13px] leading-[18px] text-muted-foreground">{subrotulo}</p>
      )}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
};
