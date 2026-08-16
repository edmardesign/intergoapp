import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { getPainelSecretaria } from "@/lib/painel.functions";
import { PainelHeader } from "@/components/painel/PainelHeader";
import { PainelSecretariaView } from "@/components/painel/PainelSecretariaView";

export const Route = createFileRoute("/painel/secretaria/$id")({
  ssr: false,
  component: PainelSecretariaPage,
  errorComponent: ({ error }) => (
    <div className="p-4 pt-12" role="alert">
      <p className="text-[15px] text-[#FF3B30]">
        Não foi possível carregar este painel: {error.message}
      </p>
    </div>
  ),
  notFoundComponent: () => <div className="p-4 pt-12">Secretaria não encontrada.</div>,
});

function PainelSecretariaPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fetchSecretaria = useServerFn(getPainelSecretaria);

  const query = useQuery({
    queryKey: ["painel", "secretaria", id],
    queryFn: () => fetchSecretaria({ data: { secretariaId: id } }),
    staleTime: 60_000,
  });

  const dados = query.data;

  return (
    <div className="min-h-screen bg-background p-4 pt-12 pb-24">
      {query.isLoading || !dados ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      ) : (
        <>
          <PainelHeader
            titulo={`Painel · ${dados.secretaria.nome}`}
            subtitulo={`${dados.municipio} · ${dados.uf}${dados.somente_leitura ? " · somente leitura" : ""}`}
            atualizadoEm={dados.atualizado_em}
            atualizando={query.isFetching}
            onAtualizar={() => query.refetch()}
            onVoltar={() => navigate({ to: "/painel" })}
          />
          <PainelSecretariaView dados={dados} />
        </>
      )}
    </div>
  );
}
