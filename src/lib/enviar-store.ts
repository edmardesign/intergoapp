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

export interface EnviarState {
  tipo: MensagemTipo | null;
  payload: MensagemPayload;
  exigir_confirmacao: boolean;
  urgente: boolean;
  destinatarios: string[]; // IDs dos perfis
  anexos: Array<{
    nome: string;
    url: string;
    tamanho: number;
    tipo_mime: string;
  }>;
  
  setTipo: (tipo: MensagemTipo | null) => void;
  updatePayload: (data: Partial<MensagemPayload>) => void;
  setExigirConfirmacao: (val: boolean) => void;
  setUrgente: (val: boolean) => void;
  setDestinatarios: (ids: string[]) => void;
  addAnexo: (anexo: EnviarState['anexos'][0]) => void;
  removeAnexo: (url: string) => void;
  clear: () => void;
}

export const useEnviarStore = (tipo: MensagemTipo) => {
  const store = create<EnviarState>()(
    persist(
      (set) => ({
        tipo: null,
        payload: {},
        exigir_confirmacao: false,
        urgente: false,
        destinatarios: [],
        anexos: [],
        
        setTipo: (tipo) => set({ tipo }),
        updatePayload: (data) => set((state) => ({ payload: { ...state.payload, ...data } })),
        setExigirConfirmacao: (exigir_confirmacao) => set({ exigir_confirmacao }),
        setUrgente: (urgente) => set({ urgente }),
        setDestinatarios: (destinatarios) => set({ destinatarios }),
        addAnexo: (anexo) => set((state) => ({ anexos: [...state.anexos, anexo] })),
        removeAnexo: (url) => set((state) => ({ anexos: state.anexos.filter(a => a.url !== url) })),
        clear: () => set({ payload: {}, exigir_confirmacao: false, urgente: false, destinatarios: [], anexos: [] }),
      }),
      {
        name: `enviar_v1_${tipo}`,
      }
    )
  );
  return store;
};
