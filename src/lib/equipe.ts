import { supabase } from '@/integrations/supabase/client'

/**
 * Consultas de equipe executadas no cliente (respeitam RLS pela sessão do usuário).
 * Server functions não enxergam a sessão do Supabase neste projeto.
 */

async function uid(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Não autenticado')
  return session.user.id
}

export async function getEquipeClient(): Promise<any[]> {
  const id = await uid()
  const { data, error } = await (supabase as any).rpc('get_equipe_detalhada', { _user_id: id })
  if (error) throw error
  return (data as any[]) ?? []
}

export async function getMeClient(): Promise<any> {
  const id = await uid()
  const { data, error } = await (supabase as any)
    .from('perfis')
    .select('*, cargos:nivel_id(*)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getEquipeStatsClient(): Promise<any[]> {
  const id = await uid()
  const { data, error } = await (supabase as any).rpc('get_equipe_stats', { p_superior_id: id })
  if (error) throw error
  return (data as any[]) ?? []
}

export async function getLotacaoCoordenadoresClient(municipio_id: string): Promise<any[]> {
  const { data, error } = await (supabase as any).rpc('get_lotacao_coordenadores', {
    _municipio_id: municipio_id,
  })
  if (error) throw error
  return (data as any[]) ?? []
}

export async function reatribuirLotacaoClient(unidade_id: string, coordenador_id: string) {
  await uid()
  const { error: delErr } = await (supabase as any)
    .from('perfil_unidades')
    .delete()
    .eq('unidade_id', unidade_id)
  if (delErr) throw delErr

  const { error } = await (supabase as any)
    .from('perfil_unidades')
    .insert({ perfil_id: coordenador_id, unidade_id, principal: true })
  if (error) throw error
  return { success: true }
}
