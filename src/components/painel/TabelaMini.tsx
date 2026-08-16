import React from "react";
import { cn } from "@/lib/utils";

export interface ColunaMini<T> {
  chave: string;
  titulo: string;
  alinhar?: "left" | "right";
  render: (linha: T) => React.ReactNode;
  ordenavel?: boolean;
  valorOrdenacao?: (linha: T) => number | string;
}

export interface TabelaMiniProps<T> {
  colunas: ColunaMini<T>[];
  linhas: T[];
  chaveLinha: (linha: T) => string;
  limite?: number;
  onVerTodos?: () => void;
  destacar?: (linha: T) => boolean;
  vazio?: string;
  rodape?: React.ReactNode;
  className?: string;
}

export function TabelaMini<T>({
  colunas,
  linhas,
  chaveLinha,
  limite = 5,
  onVerTodos,
  destacar,
  vazio = "Sem dados por enquanto.",
  rodape,
  className,
}: TabelaMiniProps<T>) {
  const [ordem, setOrdem] = React.useState<{ chave: string; asc: boolean } | null>(null);

  const ordenadas = React.useMemo(() => {
    if (!ordem) return linhas;
    const coluna = colunas.find((c) => c.chave === ordem.chave);
    if (!coluna?.valorOrdenacao) return linhas;
    const copia = [...linhas];
    copia.sort((a, b) => {
      const va = coluna.valorOrdenacao!(a);
      const vb = coluna.valorOrdenacao!(b);
      if (va === vb) return 0;
      return (va > vb ? 1 : -1) * (ordem.asc ? 1 : -1);
    });
    return copia;
  }, [linhas, ordem, colunas]);

  const visiveis = ordenadas.slice(0, limite);

  if (linhas.length === 0) {
    return <p className="py-4 text-[13px] leading-[18px] text-muted-foreground">{vazio}</p>;
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {colunas.map((c) => (
              <th
                key={c.chave}
                onClick={() =>
                  c.ordenavel &&
                  setOrdem((prev) =>
                    prev?.chave === c.chave ? { chave: c.chave, asc: !prev.asc } : { chave: c.chave, asc: false },
                  )
                }
                className={cn(
                  "border-b border-[#E5E5EA] py-2 text-[11px] font-semibold uppercase leading-[18px] tracking-wide text-muted-foreground",
                  c.alinhar === "right" ? "text-right" : "text-left",
                  c.ordenavel && "cursor-pointer select-none",
                )}
              >
                {c.titulo}
                {ordem?.chave === c.chave ? (ordem.asc ? " ↑" : " ↓") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visiveis.map((linha) => (
            <tr key={chaveLinha(linha)} className={cn(destacar?.(linha) && "bg-[#FF3B30]/[0.06]")}>
              {colunas.map((c) => (
                <td
                  key={c.chave}
                  className={cn(
                    "border-b border-[#E5E5EA] py-2.5 text-[15px] leading-5 text-foreground",
                    c.alinhar === "right" ? "text-right" : "text-left",
                  )}
                >
                  {c.render(linha)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {rodape && <tfoot>{rodape}</tfoot>}
      </table>
      {onVerTodos && linhas.length > limite && (
        <button
          type="button"
          onClick={onVerTodos}
          className="mt-2 text-[15px] font-medium text-primary"
        >
          Ver todos
        </button>
      )}
    </div>
  );
}
