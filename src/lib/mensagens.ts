import { supabase } from '@/integrations/supabase/client'
import type { MensagemTipo, MensagemPayload } from '@/lib/enviar-store'

/** Fuso oficial do produto — todo agrupamento de dia usa este fuso. */
export const TIMEZONE = 'America/Sao_Paulo'

export interface TipoMeta {
  label: string
  bg: string
  fg: string
}

export const TIPO_META: Record<MensagemTipo, TipoMeta> = {
  comunicado: { label: 'Comunicado', bg: '#E8EFF6', fg: '#1B4F8C' },
  demanda: { label: 'Demanda', bg: '#FFF4E5', fg: '#B25F00' },
  reuniao: { label: 'Reunião', bg: '#E7F8EC', fg: '#1E7C36' },
  evento: { label: 'Evento', bg: '#F1E9FA', fg: '#5B2F9E' },
}

export function tipoMeta(tipo: string): TipoMeta {
  return TIPO_META[(tipo as MensagemTipo)] ?? TIPO_META.comunicado
}

export interface Mensagem {
  id: string
  remetente_id: string
  tipo: MensagemTipo
  payload: MensagemPayload
  exigir_confirmacao: boolean
  urgente: boolean
  created_at: string
}

export interface MensagemRecebida {
  mensagem: Mensagem
  lido_em: string | null
  confirmado_em: string | null
  entregue_em: string | null
}

export interface PessoaMin {
  id: string
  nome: string
  cargo: string
  unidade: string
}

/* ------------------------------------------------------------------ */
/* Conteúdo                                                            */
/* ------------------------------------------------------------------ */

export function assuntoDe(m: Mensagem): string {
  const p = m.payload ?? {}
  return p.assunto || p.titulo || 'Sem assunto'
}

export function corpoDe(m: Mensagem): string {
  const p = m.payload ?? {}
  return p.corpo || p.o_que_precisa || p.pauta || p.descricao || ''
}

/* ------------------------------------------------------------------ */
/* Datas (sempre em America/Sao_Paulo)                                 */
/* ------------------------------------------------------------------ */

/** Chave de dia "AAAA-MM-DD" calculada no fuso de São Paulo. */
export function chaveDia(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  // en-CA produz diretamente o formato AAAA-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function hojeChave(): string {
  return chaveDia(new Date())
}

export function ontemChave(): string {
  return chaveDia(new Date(Date.now() - 24 * 60 * 60 * 1000))
}

/** "há 12 min", "há 3 h", "há 2 d" */
export function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `há ${d} d`
  return dataCurta(iso)
}

/** "14 de agosto às 09:32" */
export function dataExtensa(iso: string): string {
  const d = new Date(iso)
  const dia = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'long',
  }).format(d)
  const hora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
  return `${dia} às ${hora}`
}

/** "04/08" */
export function dataCurta(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(iso))
}

export function horaCurta(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

/** Rótulo do grupo em "Anteriores": "Ontem" ou "Segunda 04/08". */
export function rotuloDia(chave: string): string {
  if (chave === hojeChave()) return 'Hoje'
  if (chave === ontemChave()) return 'Ontem'
  // chave é AAAA-MM-DD no fuso de SP; meio-dia UTC evita virada de dia
  const d = new Date(`${chave}T12:00:00Z`)
  const semana = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE,
    weekday: 'long',
  }).format(d)
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)} ${dataCurta(d.toISOString())}`
}

/** Dias restantes até um prazo (AAAA-MM-DD), no fuso de SP. */
export function diasAte(prazo?: string): number | null {
  if (!prazo) return null
  const hoje = new Date(`${hojeChave()}T12:00:00Z`).getTime()
  const alvo = new Date(`${prazo}T12:00:00Z`).getTime()
  if (Number.isNaN(alvo)) return null
  return Math.round((alvo - hoje) / (24 * 60 * 60 * 1000))
}

/* ------------------------------------------------------------------ */
/* Diretório de pessoas (nomes vêm de RPC security definer)            */
/* ------------------------------------------------------------------ */

let diretorioCache: Map<string, PessoaMin> | null = null

export async function getDiretorio(force = false): Promise<Map<string, PessoaMin>> {
  if (diretorioCache && !force) return diretorioCache

  const [{ data: pessoas }, { data: niveis }, { data: unidades }] = await Promise.all([
    (supabase as any).rpc('perfis_publicos_min'),
    (supabase as any).from('niveis').select('id, nome'),
    (supabase as any).from('unidades').select('id, nome'),
  ])

  const nivelMap = new Map<string, string>((niveis ?? []).map((n: any) => [n.id, n.nome]))
  const unidadeMap = new Map<string, string>((unidades ?? []).map((u: any) => [u.id, u.nome]))

  const map = new Map<string, PessoaMin>()
  for (const p of pessoas ?? []) {
    map.set(p.id, {
      id: p.id,
      nome: p.nome_completo ?? 'Usuário',
      cargo: (p.nivel_id && nivelMap.get(p.nivel_id)) || '',
      unidade: (p.unidade_id && unidadeMap.get(p.unidade_id)) || '',
    })
  }
  diretorioCache = map
  return map
}

/* ------------------------------------------------------------------ */
/* Leitura                                                             */
/* ------------------------------------------------------------------ */

const SELECT_RECEBIDA =
  'lido_em, confirmado_em, entregue_em, mensagens!inner(id, remetente_id, tipo, payload, exigir_confirmacao, urgente, created_at)'

function mapRecebida(row: any): MensagemRecebida {
  return {
    lido_em: row.lido_em,
    confirmado_em: row.confirmado_em,
    entregue_em: row.entregue_em,
    mensagem: row.mensagens as Mensagem,
  }
}

/** Todas as recebidas do usuário, mais recentes primeiro (paginado). */
export async function listarRecebidas(userId: string, offset = 0, limit = 20) {
  const { data, error } = await (supabase as any)
    .from('mensagem_destinatarios')
    .select(SELECT_RECEBIDA)
    .eq('destinatario_id', userId)
    .order('created_at', { referencedTable: 'mensagens', ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  const itens = (data ?? []).map(mapRecebida)
  // A ordenação por tabela referenciada não reordena a linha-pai: garantimos aqui.
  itens.sort(
    (a: MensagemRecebida, b: MensagemRecebida) =>
      new Date(b.mensagem.created_at).getTime() - new Date(a.mensagem.created_at).getTime(),
  )
  return itens
}

export async function getRecebida(userId: string, mensagemId: string) {
  const { data, error } = await (supabase as any)
    .from('mensagem_destinatarios')
    .select(SELECT_RECEBIDA)
    .eq('destinatario_id', userId)
    .eq('mensagem_id', mensagemId)
    .maybeSingle()
  if (error) throw error
  return data ? mapRecebida(data) : null
}

export async function getMensagem(mensagemId: string): Promise<Mensagem | null> {
  const { data, error } = await (supabase as any)
    .from('mensagens')
    .select('id, remetente_id, tipo, payload, exigir_confirmacao, urgente, created_at')
    .eq('id', mensagemId)
    .maybeSingle()
  if (error) throw error
  return data as Mensagem | null
}

export async function getAnexos(mensagemId: string) {
  const { data, error } = await (supabase as any)
    .from('anexos')
    .select('id, nome, url, tamanho, tipo_mime')
    .eq('mensagem_id', mensagemId)
  if (error) throw error
  return data ?? []
}

/** URL assinada (1h) para um anexo do bucket "anexos". */
export async function urlAssinada(caminhoOuUrl: string): Promise<string> {
  const marcador = '/anexos/'
  const idx = caminhoOuUrl.indexOf(marcador)
  const caminho = idx >= 0 ? caminhoOuUrl.slice(idx + marcador.length) : caminhoOuUrl
  const { data, error } = await supabase.storage.from('anexos').createSignedUrl(caminho, 3600)
  if (error || !data?.signedUrl) return caminhoOuUrl
  return data.signedUrl
}

/* ------------------------------------------------------------------ */
/* Escrita                                                             */
/* ------------------------------------------------------------------ */

export async function confirmarRecebimento(mensagemId: string, userId: string) {
  const { error } = await (supabase as any)
    .from('mensagem_destinatarios')
    .update({ confirmado_em: new Date().toISOString() })
    .eq('mensagem_id', mensagemId)
    .eq('destinatario_id', userId)
  if (error) throw error
}

export async function marcarComoLida(mensagemId: string, userId: string) {
  const { error } = await (supabase as any)
    .from('mensagem_destinatarios')
    .update({ lido_em: new Date().toISOString() })
    .eq('mensagem_id', mensagemId)
    .eq('destinatario_id', userId)
    .is('lido_em', null)
  if (error) throw error
}

/* ------------------------------------------------------------------ */
/* Enviadas                                                            */
/* ------------------------------------------------------------------ */

export interface MensagemEnviada {
  mensagem: Mensagem
  total: number
  confirmados: number
}

export async function listarEnviadas(userId: string): Promise<MensagemEnviada[]> {
  const { data: msgs, error } = await (supabase as any)
    .from('mensagens')
    .select('id, remetente_id, tipo, payload, exigir_confirmacao, urgente, created_at')
    .eq('remetente_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  if (!msgs?.length) return []

  const { data: dests } = await (supabase as any)
    .from('mensagem_destinatarios')
    .select('mensagem_id, confirmado_em')
    .in(
      'mensagem_id',
      msgs.map((m: any) => m.id),
    )

  return msgs.map((m: any) => {
    const linhas = (dests ?? []).filter((d: any) => d.mensagem_id === m.id)
    return {
      mensagem: m as Mensagem,
      total: linhas.length,
      confirmados: linhas.filter((d: any) => d.confirmado_em).length,
    }
  })
}

export interface DestinatarioStatus {
  destinatario_id: string
  confirmado_em: string | null
  pessoa: PessoaMin
}

export async function listarDestinatarios(mensagemId: string): Promise<DestinatarioStatus[]> {
  const [{ data, error }, diretorio] = await Promise.all([
    (supabase as any)
      .from('mensagem_destinatarios')
      .select('destinatario_id, confirmado_em')
      .eq('mensagem_id', mensagemId),
    getDiretorio(),
  ])
  if (error) throw error
  return (data ?? []).map((d: any) => ({
    destinatario_id: d.destinatario_id,
    confirmado_em: d.confirmado_em,
    pessoa:
      diretorio.get(d.destinatario_id) ??
      { id: d.destinatario_id, nome: 'Usuário', cargo: '', unidade: '' },
  }))
}

/* ------------------------------------------------------------------ */
/* Cobrança (memória local, 24h)                                       */
/* ------------------------------------------------------------------ */

export function cobrancaKey(msgId: string, destId: string) {
  return `cobranca_${msgId}_${destId}`
}

export function cobrancaAtiva(msgId: string, destId: string): boolean {
  if (typeof window === 'undefined') return false
  const raw = window.localStorage.getItem(cobrancaKey(msgId, destId))
  if (!raw) return false
  const t = Number(raw)
  return Number.isFinite(t) && Date.now() - t < 24 * 60 * 60 * 1000
}

export function registrarCobranca(msgId: string, destId: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(cobrancaKey(msgId, destId), String(Date.now()))
}

/* ------------------------------------------------------------------ */
/* Realtime com fallback para polling                                  */
/* ------------------------------------------------------------------ */

/**
 * Assina alterações em `mensagens` e `mensagem_destinatarios`.
 * Se a assinatura falhar (CHANNEL_ERROR / TIMED_OUT), cai para polling de 30s.
 */
export function assinarMensagens(userId: string, onChange: () => void) {
  let polling: ReturnType<typeof setInterval> | null = null

  const iniciarPolling = () => {
    if (polling) return
    polling = setInterval(onChange, 30000)
  }

  const canal = supabase
    .channel(`inicio_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'mensagem_destinatarios',
        filter: `destinatario_id=eq.${userId}`,
      },
      onChange,
    )
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, onChange)
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        iniciarPolling()
      }
    })

  return () => {
    if (polling) clearInterval(polling)
    supabase.removeChannel(canal)
  }
}

/* ------------------------------------------------------------------ */
/* ICS                                                                 */
/* ------------------------------------------------------------------ */

export function baixarICS(titulo: string, data?: string, hora?: string, local?: string) {
  if (!data) return
  const inicio = new Date(`${data}T${hora || '09:00'}:00-03:00`)
  const fim = new Date(inicio.getTime() + 60 * 60 * 1000)
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const escapar = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//INTERGO//PT-BR//',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@intergo`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(inicio)}`,
    `DTEND:${fmt(fim)}`,
    `SUMMARY:${escapar(titulo)}`,
    local ? `LOCATION:${escapar(local)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${titulo.replace(/[^a-z0-9]/gi, '_').slice(0, 40) || 'evento'}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
