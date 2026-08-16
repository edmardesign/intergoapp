import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const getEstados = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("estados" as any)
      .select("*")
      .order("nome" as any);
    if (error) throw error;
    return data;
  });

export const getMunicipios = createServerFn({ method: "GET" })
  .validator((estadoId: string) => estadoId)
  .handler(async ({ data: estadoId }) => {
    const { data, error } = await supabase
      .from("municipios" as any)
      .select("*")
      .eq("estado_id" as any, estadoId)
      .eq("ativo" as any, true)
      .order("nome" as any);
    if (error) throw error;
    return data;
  });

export const getSecretarias = createServerFn({ method: "GET" })
  .validator((municipioId: string) => municipioId)
  .handler(async ({ data: municipioId }) => {
    const { data, error } = await supabase
      .from("secretarias" as any)
      .select("*")
      .eq("municipio_id" as any, municipioId)
      .order("nome" as any);
    if (error) throw error;
    return data;
  });

export const getNiveis = createServerFn({ method: "GET" })
  .validator((secretariaId: string) => secretariaId)
  .handler(async ({ data: secretariaId }) => {
    const { data, error } = await supabase
      .from("niveis" as any)
      .select("*")
      .eq("secretaria_id" as any, secretariaId)
      .order("ordem" as any, { ascending: true });
    if (error) throw error;
    return data;
  });

export const getUnidades = createServerFn({ method: "GET" })
  .validator((secretariaId: string) => secretariaId)
  .handler(async ({ data: secretariaId }) => {
    const { data, error } = await supabase
      .from("unidades" as any)
      .select("*")
      .eq("secretaria_id" as any, secretariaId)
      .order("nome" as any);
    if (error) throw error;
    return data;
  });

export const getSuperiores = createServerFn({ method: "GET" })
  .validator((params: { 
    municipio_id: string;
    secretaria_id: string; 
    nivel_ordem: number;
    unidade_id?: string;
  }) => params)
  .handler(async ({ data: params }) => {
    const { municipio_id, secretaria_id, nivel_ordem, unidade_id } = params;
    
    if (nivel_ordem === 1) {
      const { data: niveisData } = await supabase
        .from("niveis" as any)
        .select("id")
        .eq("municipio_id" as any, municipio_id)
        .eq("ordem" as any, 0)
        .maybeSingle();

      if (niveisData) {
        const { data, error } = await supabase
          .from("perfis_publicos_min" as any)
          .select("*")
          .eq("municipio_id" as any, municipio_id)
          .eq("nivel_id" as any, (niveisData as any).id);
        if (error) throw error;
        return data;
      }
      return [];
    }

    const { data: nivelSuperior } = await supabase
      .from("niveis" as any)
      .select("id, tem_unidade")
      .eq("secretaria_id" as any, secretaria_id)
      .eq("ordem" as any, nivel_ordem - 1)
      .maybeSingle();

    if (nivelSuperior) {
      let query = supabase
        .from("perfis_publicos_min" as any)
        .select("*")
        .eq("secretaria_id" as any, secretaria_id)
        .eq("municipio_id" as any, municipio_id)
        .eq("nivel_id" as any, (nivelSuperior as any).id);

      if ((nivelSuperior as any).tem_unidade && unidade_id) {
        query = query.eq("unidade_id" as any, unidade_id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    return [];
  });

export const addToWaitlist = createServerFn({ method: "POST" })
  .validator((data: { email: string; estado_id: string; cidade_texto: string }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("waitlist" as any)
      .insert([data]);
    if (error) throw error;
    return { success: true };
  });
