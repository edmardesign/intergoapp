import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const anexoSchema = z.object({
  nome: z.string(),
  url: z.string(),
  tamanho: z.number(),
  tipo_mime: z.string(),
});

const payloadSchema = z.record(z.any());

export const getSubtreeRecipients = createServerFn({ method: "GET" })
  .handler(async () => {
    // 1. Get current user profile to get their level
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized");

    // 2. Call RPC perfis_subarvore
    const { data, error } = await (supabase as any).rpc('perfis_subarvore', { 
      superior_id_root: session.user.id 
    });
    
    if (error) throw error;
    
    // Join with profile details to get names, levels, units
    // Actually perfis_subarvore should already return these or we fetch them
    // Let's assume perfis_subarvore returns IDs, then we fetch active profiles
    const ids = (data || []).map((p: any) => p.id);
    
    if (ids.length === 0) return [];
    
    const { data: profiles, error: pError } = await (supabase as any)
      .from('perfis')
      .select('id, nome_completo, status, nivel:nivel_id(id, nome, ordem), unidade:unidade_id(id, nome)')
      .in('id', ids)
      .eq('status', 'ativo');
      
    if (pError) throw pError;
    return profiles;
  });

export const enviarMensagem = createServerFn({ method: "POST" })
  .validator((d: {
    tipo: 'comunicado' | 'demanda' | 'reuniao' | 'evento';
    payload: any;
    exigir_confirmacao: boolean;
    urgente: boolean;
    destinatarios: string[];
    anexos: any[];
  }) => d)
  .handler(async ({ data: input }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized");

    // 1. Insert Message
    const { data: msg, error: msgError } = await (supabase as any)
      .from('mensagens')
      .insert([{
        remetente_id: session.user.id,
        tipo: input.tipo,
        payload: input.payload,
        exigir_confirmacao: input.exigir_confirmacao,
        urgente: input.urgente
      }])
      .select()
      .single();

    if (msgError) throw msgError;

    // 2. Insert Recipients
    if (input.destinatarios.length > 0) {
      const recipients = input.destinatarios.map(id => ({
        mensagem_id: msg.id,
        destinatario_id: id,
        entregue_em: new Date().toISOString()
      }));
      
      const { error: recError } = await (supabase as any)
        .from('mensagem_destinatarios')
        .insert(recipients);
        
      if (recError) throw recError;
    }

    // 3. Insert Attachments
    if (input.anexos.length > 0) {
      const anexos = input.anexos.map(a => ({
        mensagem_id: msg.id,
        nome: a.nome,
        url: a.url,
        tamanho: a.tamanho,
        tipo_mime: a.tipo_mime
      }));
      
      const { error: anxError } = await (supabase as any)
        .from('anexos')
        .insert(anexos);
        
      if (anxError) throw anxError;
    }

    return { success: true, mensagem_id: msg.id };
  });
