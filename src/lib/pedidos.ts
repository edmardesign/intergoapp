import { supabase } from '@/integrations/supabase/client'
import { getDiretorio, tempoRelativo, type PessoaMin } from '@/lib/mensagens'

export type SolicitacaoStatus = 'solicitado' | 'em_analise' | 'aprovado' | 'negado' | 'entregue'
export type SolicitacaoAcao = 'criou' | 'encaminhou' | 'aprovou' | 'negou' | 'entregou'

export interface Solicitacao {
  id: string
  solicitante_id: string
  responsavel_atual_id: string | null
  item: string
  quantidade: number
  unidade_medida: string
  justificativa: string
  urgencia: 'normal' | 'urgente'
  status: SolicitacaoStatus
  created_at: string
  updated_at: string
}

export interface SolicitacaoEvento {
  id: string
  solicitacao_id: string
  autor_id: string
  acao: SolicitacaoAcao
  observacao: string | null
  created_at: string
}

/* Selos de status --------------------------------------------------- */

export const STATUS_META: Record<SolicitacaoStatus, { label: string; cor: string }> = {
  solicitado: { label: 'Novo', cor: '#AEAEB2' },
  em_analise: { label: 'Em análise', cor: '#FF9F0A' },
  aprovado: { label: 'Aprovado', cor: '#34C759' },
  negado: { label: 'Negado', cor: '#FF3B30' },
  entregue: { label: 'Entregue', cor: '#1B4F8C' },
}

export const ACAO_META: Record<SolicitacaoAcao, { label: string; cor: string }> = {
  criou: { label: 'Criou o pedido', cor: '#1B4F8C' },
  encaminhou: { label: 'Encaminhou', cor: '#AEAEB2' },
  aprovou: { label: 'Aprovou', cor: '#34C759' },
  negou: { label: 'Negou', cor: '#FF3B30' },
  entregou: { label: 'Entregou', cor: '#1B4F8C' },
}

export const UNIDADES_MEDIDA = [
  'litros',
  'kg',
  'unidades',
  'pacotes',
  'resmas',
  'caixas',
  'm²',
  'h',
]

export const STATUS_ABERTOS: SolicitacaoStatus[] = ['solicitado', 'em_analise', 'aprovado']
export const STATUS_FINAIS: SolicitacaoStatus[] = ['entregue', 'negado']

export function quantidadeFormatada(q: number, unidade: string) {
  const n = Number(q)
  const txt = Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',')
  return `${txt} ${unidade}`
}

export { tempoRelativo }
export type { PessoaMin }

/* Contexto do usuário ------------------------------------------------ */

export interface MeuContexto {
  id: string
  superior_id: string | null
  cargo: string
  podeCriar: boolean
  isSecretario: boolean
  isPrefeito: boolean
  superior: PessoaMin | null
}

export async function getMeuContexto(userId: string): Promise<MeuContexto> {
  const [{ data: perfil }, diretorio] = await Promise.all([
    (supabase as any)
      .from('perfis')
      .select('id, superior_id, nivel:nivel_id(nome)')
      .eq('id', userId)
      .maybeSingle(),
    getDiretorio(),
  ])

  const cargo: string = perfil?.nivel?.nome ?? ''
  const c = cargo.toLowerCase()
  const superior_id = perfil?.superior_id ?? null

  return {
    id: userId,
    superior_id,
    cargo,
    podeCriar: !!superior_id,
    isSecretario: c.includes('secret'),
    isPrefeito: c.includes('prefeito'),
    superior: superior_id ? diretorio.get(superior_id) ?? null : null,
  }
}

/* Leitura ------------------------------------------------------------ */

const SELECT_SOLIC =
  'id, solicitante_id, responsavel_atual_id, item, quantidade, unidade_medida, justificativa, urgencia, status, created_at, updated_at'

export async function listarMinhas(userId: string): Promise<Solicitacao[]> {
  const { data, error } = await (supabase as any)
    .from('solicitacoes')
    .select(SELECT_SOLIC)
    .eq('solicitante_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Solicitacao[]
}

export async function listarParaAnalisar(userId: string): Promise<Solicitacao[]> {
  const { data, error } = await (supabase as any)
    .from('solicitacoes')
    .select(SELECT_SOLIC)
    .eq('responsavel_atual_id', userId)
    .not('status', 'in', '(entregue,negado)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Solicitacao[]
}

/**
 * Histórico: tudo em que o usuário participou (criou, é responsável ou agiu)
 * e que já está finalizado (entregue ou negado). Rolagem infinita por offset.
 */
export async function listarHistorico(
  userId: string,
  offset = 0,
  limit = 20,
): Promise<Solicitacao[]> {
  const { data: eventos } = await (supabase as any)
    .from('solicitacao_eventos')
    .select('solicitacao_id')
    .eq('autor_id', userId)

  const ids = Array.from(new Set((eventos ?? []).map((e: any) => e.solicitacao_id))) as string[]

  const filtros = [`solicitante_id.eq.${userId}`, `responsavel_atual_id.eq.${userId}`]
  if (ids.length > 0) filtros.push(`id.in.(${ids.join(',')})`)

  const { data, error } = await (supabase as any)
    .from('solicitacoes')
    .select(SELECT_SOLIC)
    .in('status', STATUS_FINAIS)
    .or(filtros.join(','))
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return (data ?? []) as Solicitacao[]
}

export async function getSolicitacao(id: string): Promise<Solicitacao | null> {
  const { data, error } = await (supabase as any)
    .from('solicitacoes')
    .select(SELECT_SOLIC)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as Solicitacao) ?? null
}

export async function listarEventos(solicitacaoId: string): Promise<SolicitacaoEvento[]> {
  const { data, error } = await (supabase as any)
    .from('solicitacao_eventos')
    .select('id, solicitacao_id, autor_id, acao, observacao, created_at')
    .eq('solicitacao_id', solicitacaoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as SolicitacaoEvento[]
}

export async function listarAnexosDoPedido(solicitacaoId: string) {
  const { data } = await (supabase as any)
    .from('anexos')
    .select('id, nome, url, tamanho, tipo_mime')
    .eq('solicitacao_id', solicitacaoId)
  return data ?? []
}

/* Escrita ------------------------------------------------------------ */

export interface NovoPedidoInput {
  item: string
  quantidade: number
  unidade_medida: string
  justificativa: string
  urgente: boolean
  anexos: { nome: string; url: string; tamanho: number; tipo_mime: string }[]
}

export async function criarPedido(
  userId: string,
  superiorId: string,
  input: NovoPedidoInput,
): Promise<string> {
  const { data, error } = await (supabase as any)
    .from('solicitacoes')
    .insert({
      solicitante_id: userId,
      responsavel_atual_id: superiorId,
      item: input.item.trim(),
      quantidade: input.quantidade,
      unidade_medida: input.unidade_medida,
      justificativa: input.justificativa.trim(),
      urgencia: input.urgente ? 'urgente' : 'normal',
      status: 'solicitado',
    })
    .select('id')
    .single()
  if (error) throw error

  const id = data.id as string

  const { error: evErro } = await (supabase as any).from('solicitacao_eventos').insert({
    solicitacao_id: id,
    autor_id: userId,
    acao: 'criou',
  })
  if (evErro) throw evErro

  if (input.anexos.length > 0) {
    const { error: anErro } = await (supabase as any)
      .from('anexos')
      .insert(input.anexos.map((a) => ({ ...a, solicitacao_id: id })))
    if (anErro) throw anErro
  }

  return id
}

async function registrarEvento(
  solicitacaoId: string,
  userId: string,
  acao: SolicitacaoAcao,
  observacao?: string,
) {
  const { error } = await (supabase as any).from('solicitacao_eventos').insert({
    solicitacao_id: solicitacaoId,
    autor_id: userId,
    acao,
    observacao: observacao?.trim() || null,
  })
  if (error) throw error
}

async function atualizar(solicitacaoId: string, patch: Record<string, unknown>) {
  const { error } = await (supabase as any)
    .from('solicitacoes')
    .update(patch)
    .eq('id', solicitacaoId)
  if (error) throw error
}

/**
 * Aprovar. Secretário/Prefeito fecham a aprovação (status='aprovado');
 * níveis intermediários mantêm o pedido em análise — eles encaminham depois.
 */
export async function aprovar(
  pedido: Solicitacao,
  ctx: MeuContexto,
  observacao?: string,
) {
  const final = ctx.isSecretario || ctx.isPrefeito
  await atualizar(pedido.id, { status: final ? 'aprovado' : 'em_analise' })
  await registrarEvento(pedido.id, ctx.id, 'aprovou', observacao)
}

/** Encaminhar: sempre e apenas para o superior direto do usuário atual. */
export async function encaminhar(pedido: Solicitacao, ctx: MeuContexto) {
  if (!ctx.superior_id) throw new Error('Você não tem superior para encaminhar.')
  await atualizar(pedido.id, {
    responsavel_atual_id: ctx.superior_id,
    status: pedido.status === 'solicitado' ? 'em_analise' : pedido.status,
  })
  await registrarEvento(pedido.id, ctx.id, 'encaminhou')
}

export async function negar(pedido: Solicitacao, ctx: MeuContexto, motivo: string) {
  await atualizar(pedido.id, { status: 'negado' })
  await registrarEvento(pedido.id, ctx.id, 'negou', motivo)
}

export async function entregar(pedido: Solicitacao, ctx: MeuContexto, observacao?: string) {
  await atualizar(pedido.id, { status: 'entregue' })
  await registrarEvento(pedido.id, ctx.id, 'entregou', observacao)
}

/* Realtime ----------------------------------------------------------- */

export function assinarPedidos(userId: string, onChange: (row: any, tipo: string) => void) {
  const canal = supabase
    .channel(`pedidos_${userId}`)
    .on(
      'postgres_changes' as any,
      { event: '*', schema: 'public', table: 'solicitacoes' },
      (payload: any) => {
        const row = payload.new ?? payload.old
        if (!row) return
        if (row.responsavel_atual_id === userId || row.solicitante_id === userId) {
          onChange(row, payload.eventType)
        }
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(canal)
  }
}
