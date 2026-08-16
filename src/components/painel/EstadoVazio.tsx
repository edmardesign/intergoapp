import React from "react";

export interface EstadoVazioProps {
  mensagem?: string;
}

export const EstadoVazio: React.FC<EstadoVazioProps> = ({
  mensagem = "Ainda não temos dados suficientes para calcular esta métrica — volte após enviar algumas mensagens.",
}) => (
  <p className="rounded-2xl bg-card p-4 text-[13px] leading-[18px] text-muted-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
    {mensagem}
  </p>
);
