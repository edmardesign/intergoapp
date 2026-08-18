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
  .validator((d: string) => d)
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
  .validator((d: string) => d)
  .handler(async ({ data: municipioId }) => {
    const { data, error } = await supabase
      .from("secretarias")
      .select("*")
      .eq("municipio_id", municipioId)
      .order("nome");
    if (error) throw error;
    return data;
  });

export const getCargos = createServerFn({ method: "GET" })
  .validator((secretariaId: string) => secretariaId)
  .handler(async ({ data: secretariaId }) => {
    const { data, error } = await supabase
      .from("cargos")
      .select("*")
      .eq("secretaria_id", secretariaId)
      .order("ordem_exibicao", { ascending: true });
    if (error) throw error;
    return data;
  });

export const getUnidades = createServerFn({ method: "GET" })
  .validator((d: string) => d)
  .handler(async ({ data: secretariaId }) => {
    const { data, error } = await supabase
      .from("unidades")
      .select("*")
      .eq("secretaria_id", secretariaId)
      .order("nome");
    if (error) throw error;
    return data;
  });
