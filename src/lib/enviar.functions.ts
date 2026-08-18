import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const canUserSend = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { canSend: false };

    // Check profile's cargo permissions
    const { data: profile } = await supabase
      .from('perfis')
      .select('cargo:nivel_id(pode_enviar_descendente)')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!profile || !(profile.cargo as any)?.pode_enviar_descendente) {
      return { canSend: false };
    }

    // Check if user has subordinates
    const { data: subordinates, error } = await (supabase as any).rpc('perfis_subarvore', { 
      superior_id_root: session.user.id 
    });

    if (error || !subordinates || subordinates.length === 0) {
      return { canSend: false };
    }

    return { canSend: true };
  });

export const getSubtreeRecipients = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Unauthorized");

    const { data, error } = await (supabase as any).rpc('perfis_subarvore', { 
      superior_id_root: session.user.id 
    });
    
    if (error) throw error;
    
    const ids = (data || []).map((p: any) => p.id);
    if (ids.length === 0) return [];
    
    const { data: profiles, error: pError } = await (supabase as any)
      .from('perfis')
      .select('id, nome_completo, status, nivel:nivel_id(id, nome, ordem), unidade_id')
      .in('id', ids)
      .eq('status', 'ativo');
      
    if (pError) throw pError;
    
    // Fetch units separately to handle many-to-many if needed, 
    // but for now let's use a join or separate fetch for lotations
    const { data: lotacoes } = await (supabase as any)
      .from('perfil_unidades')
      .select('perfil_id, unidade:unidade_id(id, nome)')
      .in('perfil_id', ids);

    return (profiles || []).map((p: any) => ({
      ...p,
      unidades: (lotacoes || [])
        .filter((l: any) => l.perfil_id === p.id)
        .map((l: any) => l.unidade)
    }));
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
