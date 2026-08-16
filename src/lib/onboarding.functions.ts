import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export const getEstados = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabase
      .from("estados")
      .select("*")
      .order("nome");
    if (error) throw error;
    return data;
  });

export const getMunicipios = createServerFn({ method: "GET" })
  .input((estadoId: string) => estadoId)
  .handler(async ({ data: estadoId }) => {
    const { data, error } = await supabase
      .from("municipios")
      .select("*")
      .eq("estado_id", estadoId)
      .eq("ativo", true)
      .order("nome");
    if (error) throw error;
    return data;
  });

export const getSecretarias = createServerFn({ method: "GET" })
  .input((municipioId: string) => municipioId)
  .handler(async ({ data: municipioId }) => {
    const { data, error } = await supabase
      .from("secretarias")
      .select("*")
      .eq("municipio_id", municipioId)
      .order("nome");
    if (error) throw error;
    return data;
  });

export const getNiveis = createServerFn({ method: "GET" })
  .input((secretariaId: string) => secretariaId)
  .handler(async ({ data: secretariaId }) => {
    const { data, error } = await supabase
      .from("niveis")
      .select("*")
      .eq("secretaria_id", secretariaId)
      .order("ordem", { ascending: true });
    if (error) throw error;
    return data;
  });

export const getUnidades = createServerFn({ method: "GET" })
  .input((secretariaId: string) => secretariaId)
  .handler(async ({ data: secretariaId }) => {
    const { data, error } = await supabase
      .from("unidades")
      .select("*")
      .eq("secretaria_id", secretariaId)
      .order("nome");
    if (error) throw error;
    return data;
  });

export const getSuperiores = createServerFn({ method: "GET" })
  .input((params: { 
    municipio_id: string;
    secretaria_id: string; 
    nivel_ordem: number;
    unidade_id?: string;
    superior_tem_unidade?: boolean;
  }) => params)
  .handler(async ({ data: params }) => {
    const { municipio_id, secretaria_id, nivel_ordem, unidade_id, superior_tem_unidade } = params;
    
    // Se o cargo escolhido for Secretário (ordem = 1, pois Prefeito é 0), o superior é o Prefeito
    if (nivel_ordem === 1) {
      const { data, error } = await supabase
        .from("perfis_publicos_min")
        .select("*")
        .eq("municipio_id", municipio_id)
        .eq("nivel_id", (await supabase.from("niveis").select("id").eq("municipio_id", municipio_id).eq("ordem", 0).single()).data?.id);
      if (error) throw error;
      return data;
    }

    let query = supabase
      .from("perfis_publicos_min")
      .select("*")
      .eq("secretaria_id", secretaria_id)
      .eq("municipio_id", municipio_id);

    // Nível superior imediato
    const { data: nivelSuperior } = await supabase
      .from("niveis")
      .select("id, tem_unidade")
      .eq("secretaria_id", secretaria_id)
      .eq("ordem", nivel_ordem - 1)
      .single();

    if (nivelSuperior) {
      query = query.eq("nivel_id", nivelSuperior.id);
      if (nivelSuperior.tem_unidade && unidade_id) {
        query = query.eq("unidade_id", unidade_id);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  });

export const addToWaitlist = createServerFn({ method: "POST" })
  .input((data: { email: string; estado_id: string; cidade_texto: string }) => data)
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("waitlist")
      .insert([data]);
    if (error) throw error;
    return { success: true };
  });
