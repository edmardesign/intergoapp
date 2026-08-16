import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MensagemTipo = 'comunicado' | 'demanda' | 'reuniao' | 'evento';

export interface MensagemPayload {
  assunto?: string;
  corpo?: string;
  o_que_precisa?: string;
  prazo?: string;
  data?: string;
  hora?: string;
  local?: string;
  pauta?: string;
  titulo?: string;
  imagem?: string;
  descricao?: string;
}

export interface EnviarDraft {
  payload: MensagemPayload;
  exigir_confirmacao: boolean;
  urgente: boolean;
  destinatarios: string[];
  anexos: Array<{
    nome: string;
    url: string;
    tamanho: number;
    tipo_mime: string;
  }>;
}

interface EnviarState {
  drafts: Record<MensagemTipo, EnviarDraft>;
  
  updateDraft: (tipo: MensagemTipo, data: Partial<EnviarDraft>) => void;
  updatePayload: (tipo: MensagemTipo, data: Partial<MensagemPayload>) => void;
  clearDraft: (tipo: MensagemTipo) => void;
}

const initialDraft: EnviarDraft = {
  payload: {},
  exigir_confirmacao: false,
  urgente: false,
  destinatarios: [],
  anexos: [],
};

export const useEnviarStore = create<EnviarState>()(
  persist(
    (set) => ({
      drafts: {
        comunicado: { ...initialDraft },
        demanda: { ...initialDraft },
        reuniao: { ...initialDraft },
        evento: { ...initialDraft },
      },
      
      updateDraft: (tipo, data) => set((state) => ({
        drafts: {
          ...state.drafts,
          [tipo]: { ...state.drafts[tipo], ...data }
        }
      })),
      
      updatePayload: (tipo, data) => set((state) => ({
        drafts: {
          ...state.drafts,
          [tipo]: { 
            ...state.drafts[tipo], 
            payload: { ...state.drafts[tipo].payload, ...data } 
          }
        }
      })),
      
      clearDraft: (tipo) => set((state) => ({
        drafts: {
          ...state.drafts,
          [tipo]: { ...initialDraft }
        }
      })),
    }),
    {
      name: 'enviar_v1_drafts',
    }
  )
);
