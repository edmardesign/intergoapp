import React from "react";

export interface SparklineProps {
  valores: number[];
  largura?: number;
  altura?: number;
}

/** Gráfico de linha minimalista em SVG puro (sem biblioteca de charts). */
export const Sparkline: React.FC<SparklineProps> = ({ valores, largura = 280, altura = 48 }) => {
  if (!valores || valores.length < 2) {
    return <p className="text-[13px] leading-[18px] text-muted-foreground">Dados insuficientes.</p>;
  }

  const max = Math.max(...valores, 1);
  const passo = largura / (valores.length - 1);
  const pontos = valores.map((v, i) => {
    const x = i * passo;
    const y = altura - (v / max) * (altura - 6) - 3;
    return `${x},${y}`;
  });

  return (
    <svg width="100%" viewBox={`0 0 ${largura} ${altura}`} height={altura} role="img" aria-label="Mensagens por semana">
      <polyline
        points={pontos.join(" ")}
        fill="none"
        stroke="#1B4F8C"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pontos.map((p, i) => {
        const [x, y] = p.split(",");
        return <circle key={i} cx={x} cy={y} r={2.5} fill="#1B4F8C" />;
      })}
    </svg>
  );
};
