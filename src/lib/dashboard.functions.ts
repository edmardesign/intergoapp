import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const getDashboardMetrics = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized");

    // This would be much more complex in a real app, here we fetch counts
    const { count: totalPerfis } = await supabase
      .from("perfis")
      .select("*", { count: 'exact', head: true });

    const { count: pendentes } = await supabase
      .from("perfis")
      .select("*", { count: 'exact', head: true })
      .eq("status", "pendente");

    const { count: mensagensUrgentas } = await (supabase as any)
      .from("mensagens")
      .select("*", { count: 'exact', head: true })
      .eq("urgente", true);

    return {
      totalPerfis: totalPerfis || 0,
      pendentes: pendentes || 0,
      mensagensUrgentas: mensagensUrgentas || 0
    };
  });
