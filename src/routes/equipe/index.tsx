import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getEquipe, getMe, getLotacaoCoordenadores, reatribuirLotacao } from "@/lib/equipe.functions";
import { Users, ChevronRight, ChevronDown, School, AlertTriangle, RefreshCw, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileSheet } from "@/components/equipe/ProfileSheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/equipe")({
  component: EquipePage,
});

function EquipePage() {
  const [activeTab, setActiveTab] = useState<"ativos" | "pendentes" | "inativos">("ativos");
  const [equipe, setEquipe] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPerfil, setSelectedPerfil] = useState<any | null>(null);
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());
  const [lotacao, setLotacao] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchEquipe = useServerFn(getEquipe);
  const fetchMe = useServerFn(getMe);
  const fetchLotacao = useServerFn(getLotacaoCoordenadores);
  const doReatribuir = useServerFn(reatribuirLotacao);

  const loadData = async () => {
    setLoading(true);
    try {
      const [equipeData, meData] = await Promise.all([fetchEquipe(), fetchMe()]);
      setEquipe(equipeData || []);
      setMe(meData);
      
      if (meData?.cargos?.nome?.toLowerCase().includes("secretário")) {
        const lotData = await fetchLotacao({ municipio_id: meData.municipio_id });
        setLotacao(lotData || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar equipe");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEquipe = useMemo(() => {
    return equipe.filter(p => {
      const matchesTab = p.status === activeTab.slice(0, -1);
      const matchesSearch = p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.cargo_nome.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [equipe, activeTab, searchTerm]);

  const groupedBySchool = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredEquipe.forEach(p => {
      const school = p.unidades?.[0] || "Sem Escola";
      if (!groups[school]) groups[school] = [];
      groups[school].push(p);
    });
    return groups;
  }, [filteredEquipe]);

  const pendentesCount = equipe.filter(p => p.status === "pendente").length;

  const toggleSchool = (school: string) => {
    const newSet = new Set(expandedSchools);
    if (newSet.has(school)) newSet.delete(school);
    else newSet.add(school);
    setExpandedSchools(newSet);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const isSecretario = me?.cargos?.nome?.toLowerCase().includes("secretário");

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border p-4">
        <h1 className="text-2xl font-bold mb-4">Equipe</h1>
        
        <div className="flex bg-muted/30 p-1 rounded-xl mb-4">
          {(["ativos", "pendentes", "inativos"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-lg transition-all relative",
                activeTab === tab ? "bg-white text-primary shadow-sm" : "text-secondary"
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "pendentes" && pendentesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">
                  {pendentesCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
          <Input 
            placeholder="Buscar por nome ou cargo..." 
            className="pl-10 h-12 bg-muted/30 border-none rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <main className="p-4 space-y-4">
        {Object.entries(groupedBySchool).length === 0 ? (
          <div className="text-center py-12 text-secondary">
            Ninguém encontrado nesta aba.
          </div>
        ) : (
          Object.entries(groupedBySchool).map(([school, members]) => (
            <div key={school} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button 
                onClick={() => toggleSchool(school)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <School size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold">{school}</h3>
                    <p className="text-xs text-secondary">{members.length} integrantes</p>
                  </div>
                </div>
                {expandedSchools.has(school) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>

              {expandedSchools.has(school) && (
                <div className="border-t border-border">
                  {members.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPerfil(p)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-secondary">
                          <Users size={24} />
                        </div>
                        <div className={cn(
                          "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background",
                          p.status === "ativo" ? "bg-green-500" : p.status === "pendente" ? "bg-amber-500" : "bg-gray-400"
                        )} />
                      </div>
                      <div className="text-left flex-1 overflow-hidden">
                        <p className="font-bold truncate">{p.nome_completo}</p>
                        <p className="text-xs text-secondary truncate">{p.cargo_nome}</p>
                      </div>
                      <ChevronRight size={18} className="text-secondary/50" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {isSecretario && (
          <div className="pt-8 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Building size={20} /> Lotação de Coordenadores
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {lotacao.map(item => (
                <div key={item.unidade_id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-bold">{item.unidade_nome}</p>
                    {item.coordenador_nome ? (
                      <p className="text-sm text-secondary flex items-center gap-1">
                        <Users size={14} /> {item.coordenador_nome}
                      </p>
                    ) : (
                      <p className="text-sm text-amber-600 font-medium flex items-center gap-1">
                        <AlertTriangle size={14} /> Sem Coordenador
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl h-10 gap-2">
                    <RefreshCw size={16} /> Reatribuir
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <ProfileSheet 
        perfil={selectedPerfil} 
        onClose={() => setSelectedPerfil(null)} 
        onUpdate={loadData}
        canApprove={me?.id === selectedPerfil?.superior_id || me?.cargos?.delegado_do_superior}
      />
    </div>
  );
}
