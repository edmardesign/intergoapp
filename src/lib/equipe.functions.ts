import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const getEquipe = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { data, error } = await supabase.rpc("get_equipe_detalhada", { _user_id: user.id });
    if (error) throw error;
    return data as any[];
  });

export const getMe = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { data, error } = await supabase
      .from("perfis")
      .select("*, cargos(*)")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    return data;
  });

export const aprovarCadastro = createServerFn({ method: "POST" })
  .validator((d: { perfil_id: string }) => d)
  .handler(async ({ data: { perfil_id } }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    // Auditoria
    const { data: me } = await supabase.from("perfis").select("nivel_id, cargos(delegado_do_superior)").eq("id", user.id).single();
    const delegou_de_id = me?.cargos?.delegado_do_superior ? (await supabase.from("perfis").select("superior_id").eq("id", user.id).single()).data?.superior_id : null;

    const { error: updateError } = await supabase
      .from("perfis")
      .update({ 
        status: "ativo", 
        aprovado_por: user.id, 
        aprovado_em: new Date().toISOString() 
      })
      .eq("id", perfil_id);

    if (updateError) throw updateError;

    await supabase.from("auditoria").insert({
      usuario_id: user.id,
      delegou_de_id,
      acao: "aprovacao",
      entidade: "perfis",
      entidade_id: perfil_id,
      detalhes: { info: delegou_de_id ? "Aprovado via delegado" : "Aprovado pelo superior" }
    });

    return { success: true };
  });

export const negarCadastro = createServerFn({ method: "POST" })
  .validator((d: { perfil_id: string, motivo: string }) => d)
  .handler(async ({ data: { perfil_id, motivo } }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { error: updateError } = await supabase
      .from("perfis")
      .update({ 
        status: "negado", 
        motivo_negativa: motivo 
      })
      .eq("id", perfil_id);

    if (updateError) throw updateError;

    await supabase.from("auditoria").insert({
      usuario_id: user.id,
      acao: "negativa",
      entidade: "perfis",
      entidade_id: perfil_id,
      detalhes: { motivo }
    });

    return { success: true };
  });

export const getLotacaoCoordenadores = createServerFn({ method: "GET" })
  .validator((d: { municipio_id: string }) => d)
  .handler(async ({ data: { municipio_id } }) => {
    const { data, error } = await supabase.rpc("get_lotacao_coordenadores", { _municipio_id: municipio_id });
    if (error) throw error;
    return data as any[];
  });

export const reatribuirLotacao = createServerFn({ method: "POST" })
  .validator((d: { unidade_id: string, coordenador_id: string }) => d)
  .handler(async ({ data: { unidade_id, coordenador_id } }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    // Remove lotação anterior se houver para essa unidade e cargo coordenador
    // (Simplificado: remove todas as lotações da unidade para cargos de coordenador primeiro)
    const { error: deleteError } = await supabase
      .from("perfil_unidades")
      .delete()
      .eq("unidade_id", unidade_id);
    
    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from("perfil_unidades")
      .insert({ perfil_id: coordenador_id, unidade_id, principal: true });

    if (insertError) throw insertError;

    await supabase.from("auditoria").insert({
      usuario_id: user.id,
      acao: "reatribuicao_lotacao",
      entidade: "perfil_unidades",
      entidade_id: unidade_id,
      detalhes: { coordenador_id }
    });

    return { success: true };
  });
