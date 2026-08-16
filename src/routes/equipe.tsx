import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users as UsersIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/equipe")({
  component: EquipePage,
});

type Aba = 'ativos' | 'pendentes' | 'inativos';

function EquipePage() {
  const navigate = useNavigate();
  const [aba, setAba] = useState<Aba>('ativos');
  const [loading, setLoading] = useState(true);
  const [pendentesCount, setPendentesCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { count } = await supabase
        .from('perfis')
        .select('*', { count: 'exact', head: true })
        .eq('superior_id', session.user.id)
        .eq('status', 'pendente');

      setPendentesCount(count || 0);
      setLoading(false);
    };
    fetchCounts();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[34px] font-bold tracking-tight">Equipe</h1>
      </div>

      <div className="flex bg-muted p-1 rounded-xl mb-6">
        {(['ativos', 'pendentes', 'inativos'] as Aba[]).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={cn(
              "flex-1 py-2 text-[13px] font-medium rounded-lg transition-all relative",
              aba === a ? "bg-white shadow-sm text-primary" : "text-secondary"
            )}
          >
            <span className="capitalize">{a}</span>
            {a === 'pendentes' && pendentesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF3B30] text-white text-[10px] rounded-full flex items-center justify-center border-2 border-muted font-bold">
                {pendentesCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
          ))
        ) : (
          <div className="text-center py-20">
            <UsersIcon size={48} className="mx-auto text-muted mb-4" strokeWidth={1} />
            <p className="text-[15px] text-secondary">
              Nenhum cadastro aguardando
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
