import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // @ts-ignore - Route will be generated
        navigate({ to: "/onboarding" });
        return;
      }

      const { data: profile } = await supabase
        .from("perfis")
        .select("status")
        .eq("id", session.user.id)
        .single();

      if (!profile) {
        // @ts-ignore - Route will be generated
        navigate({ to: "/onboarding" });
        return;
      }

      if (profile.status === "pendente") {
        // @ts-ignore - Route will be generated
        navigate({ to: "/onboarding/aguardando" });
      } else if (profile.status === "ativo") {
        // @ts-ignore - Route will be generated
        navigate({ to: "/inicio" });
      } else if (profile.status === "negado") {
        // @ts-ignore - Route will be generated
        navigate({ to: "/onboarding/negado" });
      }
    };

    checkSession();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
