import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const solicitacaoSchema = z.object({
  item: z.string().min(2),
  quantidade: z.number().positive(),
  unidade_medida: z.string(),
  justificativa: z.string().optional(),
  urgencia: z.enum(['baixa', 'media', 'alta', 'critica']),
});

export const createSolicitacao = createServerFn({ method: "POST" })
  .validator((d: z.infer<typeof solicitacaoSchema>) => solicitacaoSchema.parse(d))
  .handler(async ({ data }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized");

    const { data: profile } = await supabase
      .from("perfis")
      .select("superior_id")
      .eq("id", session.user.id)
      .single();

    if (!profile?.superior_id) {
      throw new Error("Superior não encontrado. Você precisa ter um superior para enviar solicitações.");
    }

    const { data: solicitacao, error } = await (supabase as any)
      .from("solicitacoes")
      .insert([{
        solicitante_id: session.user.id,
        responsavel_atual_id: profile.superior_id,
        ...data,
        status: 'pendente'
      }])
      .select()
      .single();

    if (error) throw error;

    await (supabase as any).from('solicitacao_eventos').insert([{
      solicitacao_id: solicitacao.id,
      autor_id: session.user.id,
      acao: 'criou',
      observacao: 'Solicitação inicial'
    }]);

    return solicitacao;
  });

export const getMinhasSolicitacoes = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized");

    const { data, error } = await (supabase as any)
      .from("solicitacoes")
      .select(`
        *,
        eventos:solicitacao_eventos(*)
      `)
      .or(`solicitante_id.eq.${session.user.id},responsavel_atual_id.eq.${session.user.id}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  });
