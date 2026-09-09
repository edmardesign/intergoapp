import { supabase } from '@/integrations/supabase/client'
import type { MensagemPayload, MensagemTipo } from '@/lib/enviar-store'

export interface CargoDestino {
  id: string
  nome: string
  profundidade: number
}

export interface PessoaDestino {
  id: string
  nome_completo: string
  cargo_id: string
  cargo_nome: string
}

export interface DestinosHierarquicos {
  cargos: CargoDestino[]
  pessoas: PessoaDestino[]
}

export async function getDestinosHierarquicos(): Promise<DestinosHierarquicos> {
  const { data, error } = await (supabase as any).rpc('get_destinos_hierarquicos')
  if (error) throw error

  const result = data as Partial<DestinosHierarquicos> | null
  return {
    cargos: Array.isArray(result?.cargos) ? result.cargos : [],
    pessoas: Array.isArray(result?.pessoas) ? result.pessoas : [],
  }
}

interface EnviarMensagemHierarquicaInput {
  tipo: MensagemTipo
  payload: MensagemPayload
  exigirConfirmacao?: boolean
  urgente?: boolean
  pessoas?: string[]
  cargos?: string[]
}

export async function enviarMensagemHierarquica(
  input: EnviarMensagemHierarquicaInput,
): Promise<string> {
  const { data, error } = await (supabase as any).rpc('enviar_mensagem_hierarquica', {
    p_tipo: input.tipo,
    p_payload: input.payload,
    p_exigir_confirmacao: input.exigirConfirmacao ?? false,
    p_urgente: input.urgente ?? false,
    p_pessoas: input.pessoas ?? [],
    p_cargos: input.cargos ?? [],
  })

  if (error) throw error
  if (typeof data !== 'string') throw new Error('A mensagem não pôde ser registrada.')
  return data
}