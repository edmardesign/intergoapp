import React, { useEffect, useMemo, useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { getSecretarias } from '@/lib/onboarding.functions';
import { supabase } from '@/integrations/supabase/client';
import {
  School,
  Stethoscope,
  Construction,
  Briefcase,
  HeartHandshake,
  Wallet,
  Leaf,
  Drama,
  Loader2,
} from 'lucide-react';

/** Lista pré-definida de secretarias típicas de uma prefeitura. */
const SECRETARIAS_PADRAO = [
  'Saúde',
  'Educação',
  'Assistência Social',
  'Finanças',
  'Obras e Infraestrutura',
  'Administração',
  'Meio Ambiente',
  'Cultura e Esporte',
] as const;

const iconMap: Record<string, React.ElementType> = {
  Educação: School,
  Saúde: Stethoscope,
  'Obras e Infraestrutura': Construction,
  'Assistência Social': HeartHandshake,
  Finanças: Wallet,
  'Meio Ambiente': Leaf,
  'Cultura e Esporte': Drama,
};

type Secretaria = { id: string; nome: string };

export const Step4: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [secretarias, setSecretarias] = useState<Secretaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [outra, setOutra] = useState(false);
  const [nomeOutra, setNomeOutra] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!onboardingData.municipio_id) return;
    getSecretarias({ data: onboardingData.municipio_id })
      .then((rows) => {
        const lista = (rows || []) as Secretaria[];
        setSecretarias(lista);
        // Se a cidade só tem uma secretaria cadastrada, pula a tela.
        if (lista.length === 1 && lista[0]) {
          updateData({ secretaria_id: lista[0].id, secretaria_nome: lista[0].nome });
          nextStep();
          return;
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingData.municipio_id]);

  /** Nomes exibidos: os cadastrados na cidade + os padrão que faltarem. */
  const opcoes = useMemo(() => {
    const nomes = secretarias.map((s) => s.nome);
    const extras = SECRETARIAS_PADRAO.filter(
      (p) => !nomes.some((n) => n.toLowerCase() === p.toLowerCase())
    );
    return [...nomes, ...extras];
  }, [secretarias]);

  const selecionar = async (nome: string) => {
    setErro('');
    const existente = secretarias.find((s) => s.nome.toLowerCase() === nome.toLowerCase());
    if (existente) {
      updateData({ secretaria_id: existente.id, secretaria_nome: existente.nome });
      nextStep();
      return;
    }

    if (!onboardingData.municipio_id) return;
    setSalvando(true);
    try {
      const { data: id, error } = await supabase.rpc('resolver_secretaria', {
        p_municipio_id: onboardingData.municipio_id,
        p_nome: nome,
      });
      if (error) throw error;
      updateData({ secretaria_id: id as unknown as string, secretaria_nome: nome });
      nextStep();
    } catch {
      setErro('Não foi possível registrar essa secretaria. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-in fade-in duration-500 pb-32">
      <h2 className="text-question mb-6">Em qual secretaria você atua?</h2>

      <div className="grid grid-cols-1 gap-4">
        {opcoes.map((nome) => {
          const Icon = iconMap[nome] || Briefcase;
          return (
            <button
              key={nome}
              onClick={() => selecionar(nome)}
              disabled={salvando}
              className="w-full card-intergo flex items-center p-5 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-[12px] flex items-center justify-center mr-4">
                <Icon size={24} />
              </div>
              <span className="text-body font-semibold">{nome}</span>
            </button>
          );
        })}

        {!outra ? (
          <button
            onClick={() => setOutra(true)}
            className="w-full card-intergo flex items-center p-5 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-[12px] flex items-center justify-center mr-4">
              <Briefcase size={24} />
            </div>
            <span className="text-body font-semibold">Outra (citar)</span>
          </button>
        ) : (
          <div className="card-intergo p-5 space-y-3">
            <label className="text-label text-secondary block">Nome da secretaria</label>
            <input
              type="text"
              placeholder="Ex: Secretaria de Transportes"
              className="input-field"
              value={nomeOutra}
              onChange={(e) => setNomeOutra(e.target.value)}
              autoFocus
            />
            <button
              onClick={() => selecionar(nomeOutra.trim())}
              disabled={nomeOutra.trim().length < 3 || salvando}
              className="btn-primary"
            >
              {salvando ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Continuar'}
            </button>
          </div>
        )}

        {erro && <p className="text-error text-sm ml-1">{erro}</p>}
      </div>
    </div>
  );
};
