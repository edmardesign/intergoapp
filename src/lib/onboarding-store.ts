import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OnboardingData = {
  step: number;
  estado_id?: string;
  municipio_id?: string;
  secretaria_id?: string;
  secretaria_nome?: string;
  cargo_id?: string;
  unidades_ids?: string[]; // Multiple units for Coordenador
  superior_id?: string;
  nome_completo?: string;
  funcao?: string;
  cpf?: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  cidade_texto?: string;
  numero?: string;
  complemento?: string;
  email?: string;
  senha?: string;
};

/** Telas descontinuadas no fluxo (7 antiga, 12 endereço duplicado). */
const PASSOS_REMOVIDOS = [7, 12];

interface OnboardingState {
  data: OnboardingData;
  updateData: (newData: Partial<OnboardingData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  clear: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      data: { step: 1 },
      updateData: (newData) =>
        set((state) => ({
          data: { ...state.data, ...newData },
        })),
      nextStep: () =>
        set((state) => {
          let next = state.data.step + 1;
          while (PASSOS_REMOVIDOS.includes(next)) next += 1;
          return { data: { ...state.data, step: next } };
        }),
      prevStep: () =>
        set((state) => {
          let prev = state.data.step - 1;
          while (PASSOS_REMOVIDOS.includes(prev)) prev -= 1;
          return { data: { ...state.data, step: Math.max(1, prev) } };
        }),
      goToStep: (step) =>
        set((state) => ({
          data: { ...state.data, step },
        })),
      clear: () => set({ data: { step: 1 } }),
    }),
    {
      name: 'onboarding_v1',
    }
  )
);
