import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OnboardingData = {
  step: number;
  estado_id?: string;
  municipio_id?: string;
  secretaria_id?: string;
  nivel_id?: string;
  unidade_id?: string;
  superior_id?: string;
  nome_completo?: string;
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
        set((state) => ({
          data: { ...state.data, step: state.data.step + 1 },
        })),
      prevStep: () =>
        set((state) => ({
          data: { ...state.data, step: Math.max(1, state.data.step - 1) },
        })),
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
