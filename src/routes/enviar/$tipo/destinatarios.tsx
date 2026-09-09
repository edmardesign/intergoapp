import React, { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SendFlowLayout } from "@/components/enviar/SendFlowLayout";
import { useEnviarStore, MensagemTipo } from "@/lib/enviar-store";
import { getDestinosHierarquicos, type CargoDestino, type PessoaDestino } from '@/lib/hierarquia-mensagens';
import { Search, CheckCircle2, User, Users as UsersIcon, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/enviar/$tipo/destinatarios")({
  component: DestinatariosPage,
});

type Modo = 'todos' | 'cargo' | 'pessoas';

function DestinatariosPage() {
  const { tipo } = Route.useParams() as { tipo: MensagemTipo };
  const navigate = useNavigate();
  const { drafts, updateDraft } = useEnviarStore();
  const draft = drafts[tipo];

  const [modo, setModo] = useState<Modo>('todos');
  const [loading, setLoading] = useState(true);
  const [allProfiles, setAllProfiles] = useState<PessoaDestino[]>([]);
  const [cargos, setCargos] = useState<CargoDestino[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(draft?.destinatarios || []));
  const [selectedCargoIds, setSelectedCargoIds] = useState<Set<string>>(
    new Set(draft?.cargos_destinatarios || []),
  );

  useEffect(() => {
    getDestinosHierarquicos()
      .then((data) => {
        setAllProfiles(data.pessoas);
        setCargos(data.cargos);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalDestinatarios = modo === 'todos' ? cargos.length : modo === 'cargo' ? selectedCargoIds.size : selectedIds.size;

  const handleContinue = () => {
    updateDraft(tipo, {
      destinatarios: modo === 'pessoas' ? Array.from(selectedIds) : [],
      cargos_destinatarios: modo === 'todos' ? cargos.map((cargo) => cargo.id) : Array.from(selectedCargoIds),
    });
    navigate({ to: `/enviar/${tipo}/revisar` });
  };

  const filteredProfiles = allProfiles.filter(p => 
    p.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
    p.cargo_nome.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleCargo = (id: string) => setSelectedCargoIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <SendFlowLayout 
      step={2} 
      title="Para quem?"
      onBack={() => navigate({ to: `/enviar/${tipo}` })}
      footer={
        <button 
          onClick={handleContinue}
          disabled={totalDestinatarios === 0}
          className="btn-primary"
        >
          Continuar {totalDestinatarios > 0 && `(${totalDestinatarios})`}
        </button>
      }
    >
      <div className="flex bg-muted p-1 rounded-xl mb-6">
        {(['todos', 'cargo', 'pessoas'] as Modo[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              setModo(m);
              if (m === 'todos') setSelectedIds(new Set());
            }}
            className={cn(
              "flex-1 py-2 text-[13px] font-medium rounded-lg transition-all",
              modo === m ? "bg-white shadow-sm text-primary" : "text-secondary"
            )}
          >
            {m === 'todos' ? 'Todos' : m === 'cargo' ? 'Cargo' : 'Pessoas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {modo === 'todos' && (
            <div className="card-intergo text-center p-8 bg-primary/5 border border-primary/10">
              <UsersIcon size={48} className="mx-auto text-primary mb-4" />
              <h3 className="text-body font-bold text-primary">Todos abaixo de você</h3>
              <p className="text-body-secondary text-secondary mt-2">
                 Sua mensagem será entregue aos ocupantes atuais e futuros de {cargos.length} cargos abaixo de você.
              </p>
            </div>
          )}

          {modo === 'cargo' && (
            <div className="space-y-2">
              <p className="text-label text-secondary px-1">Selecione os cargos destinatários:</p>
               {cargos.map((cargo) => {
                 const isSelected = selectedCargoIds.has(cargo.id);
                return (
                  <button
                     key={cargo.id}
                     onClick={() => toggleCargo(cargo.id)}
                    className={cn(
                      "w-full card-intergo flex items-center p-4 border transition-all",
                      isSelected ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <Building2 size={20} className={cn("mr-3", isSelected ? "text-primary" : "text-secondary")} />
                    <span className={cn("text-body font-medium", isSelected ? "text-primary" : "text-foreground")}>
                       {cargo.nome}
                    </span>
                    {isSelected && <CheckCircle2 size={20} className="ml-auto text-primary" />}
                  </button>
                );
              })}
            </div>
          )}

          {modo === 'pessoas' && (
            <>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
                <input
                  className="input-field pl-12"
                  placeholder="Buscar por nome ou cargo"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
               <div className="space-y-2">
                       {filteredProfiles.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => toggleSelection(p.id)}
                          className={cn(
                            "w-full card-intergo flex items-center p-4 border transition-all",
                            selectedIds.has(p.id) ? "border-primary bg-primary/5" : "border-border"
                          )}
                        >
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mr-3">
                            <User size={20} className="text-secondary" />
                          </div>
                          <div className="flex flex-col text-left flex-1 min-w-0">
                            <span className="text-body font-semibold truncate">{p.nome_completo}</span>
                             <span className="text-label text-secondary">{p.cargo_nome}</span>
                          </div>
                          {selectedIds.has(p.id) && <CheckCircle2 size={20} className="ml-auto text-primary" />}
                        </button>
                       ))}
                 {filteredProfiles.length === 0 && (
                   <p className="py-8 text-center text-body-secondary text-secondary">
                     Ainda não há pessoas cadastradas, mas você pode enviar por cargo.
                   </p>
                 )}
              </div>
            </>
          )}
        </div>
      )}
    </SendFlowLayout>
  );
}
