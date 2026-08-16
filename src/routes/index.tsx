import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // @ts-ignore
        navigate({ to: "/onboarding" });
        return;
      }

      const { data: profile } = await supabase
        .from("perfis")
        .select("status")
        .eq("id", session.user.id)
        .single();

      if (!profile) {
        // @ts-ignore
        navigate({ to: "/onboarding" });
        return;
      }

      if (profile.status === "pendente") {
        // @ts-ignore
        navigate({ to: "/onboarding/aguardando" });
      } else if (profile.status === "ativo") {
        // @ts-ignore
        navigate({ to: "/inicio" });
      } else if (profile.status === "negado") {
        // @ts-ignore
        navigate({ to: "/onboarding/negado" });
      } else {
        // Inativo ou outro
        // @ts-ignore
        navigate({ to: "/onboarding" });
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );
}
