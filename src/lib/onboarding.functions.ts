import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const getEstados = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await (supabase as any)
      .from("estados")
      .select("*")
      .order("nome");
    if (error) throw error;
    return data;
  });

export const getMunicipios = createServerFn({ method: "GET" })
  .validator((d: number | string) => d)
  .handler(async ({ data: estadoId }) => {
    const { data, error } = await (supabase as any)
      .from("municipios")
      .select("*")
      .eq("estado_id", estadoId)
      .eq("ativo", true)
      .order("nome");
    if (error) throw error;
    return data;
  });

export const getSecretarias = createServerFn({ method: "GET" })
  .validator((d: number | string) => d)
  .handler(async ({ data: municipioId }) => {
    const { data, error } = await (supabase as any)
      .from("secretarias")
      .select("*")
      .eq("municipio_id", municipioId)
      .order("nome");
    if (error) throw error;
    return data;
  });

export const getNiveis = createServerFn({ method: "GET" })
  .validator((d: number | string) => d)
  .handler(async ({ data: secretariaId }) => {
    const { data, error } = await (supabase as any)
      .from("niveis")
      .select("*")
      .eq("secretaria_id", secretariaId)
      .order("ordem", { ascending: true });
    if (error) throw error;
    return data;
  });

export const getUnidades = createServerFn({ method: "GET" })
  .validator((d: number | string) => d)
  .handler(async ({ data: secretariaId }) => {
    const { data, error } = await (supabase as any)
      .from("unidades")
      .select("*")
      .eq("secretaria_id", secretariaId)
      .order("nome");
    if (error) throw error;
    return data;
  });

export const getSuperiores = createServerFn({ method: "GET" })
  .validator((d: { 
    municipio_id: number | string;
    secretaria_id: number | string; 
    nivel_ordem: number;
    unidade_id?: number | string;
  }) => d)
  .handler(async ({ data: params }) => {
    const { municipio_id, secretaria_id, nivel_ordem, unidade_id } = params;
    
    if (nivel_ordem === 1) {
      const { data: niveisData } = await (supabase as any)
        .from("niveis")
        .select("id")
        .eq("municipio_id", municipio_id)
        .eq("ordem", 0)
        .maybeSingle();

      if (niveisData) {
        const { data, error } = await (supabase as any).rpc("perfis_publicos_min");
        if (error) throw error;
        
        return (data || []).filter(
          (p: any) => String(p.municipio_id) === String(municipio_id) && String(p.nivel_id) === String(niveisData.id),
        );
      }
      return [];
    }

    const { data: nivelSuperior } = await (supabase as any)
      .from("niveis")
      .select("id, tem_unidade")
      .eq("secretaria_id", secretaria_id)
      .eq("ordem", nivel_ordem - 1)
      .maybeSingle();

    if (nivelSuperior) {
      const { data, error } = await (supabase as any).rpc("perfis_publicos_min");
      if (error) throw error;
      
      return (data || []).filter((p: any) => {
        if (String(p.secretaria_id) !== String(secretaria_id)) return false;
        if (String(p.municipio_id) !== String(municipio_id)) return false;
        if (String(p.nivel_id) !== String(nivelSuperior.id)) return false;
        if (nivelSuperior.tem_unidade && unidade_id && String(p.unidade_id) !== String(unidade_id)) return false;
        return true;
      });
    }

    return [];
  });

export const addToWaitlist = createServerFn({ method: "POST" })
  .validator((d: { email: string; estado_id: number | string; cidade_texto: string }) => d)
  .handler(async ({ data }) => {
    const { error } = await (supabase as any)
      .from("waitlist")
      .insert([data]);
    if (error) throw error;
    return { success: true };
  });