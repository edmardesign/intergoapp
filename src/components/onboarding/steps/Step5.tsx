import React, { useEffect, useMemo, useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { getCargos } from '@/lib/onboarding.functions';
import { Loader2 } from 'lucide-react';

type Cargo = { id: string; nome: string; escopo: string };

/** Cargos/funções típicas do setor público municipal, por área. */
const CARGOS_POR_AREA: Record<string, string[]> = {
  saude: [
    'Secretário de Saúde',
    'Diretor de Unidade de Saúde',
    'Coordenador de Atenção Básica',
    'Médico',
    'Enfermeiro',
    'Técnico de Enfermagem',
    'Agente Comunitário de Saúde',
    'Recepcionista',
  ],
  educacao: [
    'Secretário de Educação',
    'Coordenador Pedagógico',
    'Diretor Escolar',
    'Vice-Diretor',
    'Professor',
    'Secretário Escolar',
    'Auxiliar de Serviços Gerais',
  ],
  assistencia: [
    'Secretário de Assistência Social',
    'Coordenador de CRAS',
    'Coordenador de CREAS',
    'Assistente Social',
    'Psicólogo',
    'Educador Social',
  ],
  financas: [
    'Secretário de Finanças',
    'Contador',
    'Tesoureiro',
    'Fiscal de Tributos',
    'Auxiliar Administrativo',
  ],
  obras: [
    'Secretário de Obras',
    'Engenheiro Civil',
    'Arquiteto',
    'Fiscal de Obras',
    'Encarregado de Equipe',
    'Operador de Máquinas',
  ],
  administracao: [
    'Secretário de Administração',
    'Chefe de Gabinete',
    'Coordenador de Recursos Humanos',
    'Assistente Administrativo',
    'Almoxarife',
  ],
  ambiente: [
    'Secretário de Meio Ambiente',
    'Coordenador Ambiental',
    'Fiscal Ambiental',
    'Técnico Ambiental',
  ],
  cultura: [
    'Secretário de Cultura e Esporte',
    'Coordenador de Cultura',
    'Coordenador de Esportes',
    'Professor de Educação Física',
    'Produtor Cultural',
  ],
  geral: [
    'Secretário',
    'Diretor',
    'Coordenador',
    'Chefe de Setor',
    'Assistente Administrativo',
    'Servidor',
  ],
};

const areaDaSecretaria = (nome: string): string => {
  const n = (nome || '').toLowerCase();
  if (n.includes('saúde') || n.includes('saude')) return 'saude';
  if (n.includes('educa')) return 'educacao';
  if (n.includes('assist')) return 'assistencia';
  if (n.includes('finan') || n.includes('fazenda')) return 'financas';
  if (n.includes('obras') || n.includes('infra')) return 'obras';
  if (n.includes('administ')) return 'administracao';
  if (n.includes('ambient')) return 'ambiente';
  if (n.includes('cultura') || n.includes('esporte')) return 'cultura';
  return 'geral';
};

export const Step5: React.FC = () => {
  const { data: onboardingData, updateData, nextStep } = useOnboardingStore();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [outro, setOutro] = useState(false);
  const [nomeOutro, setNomeOutro] = useState('');

  useEffect(() => {
    if (!onboardingData.secretaria_id) {
      setLoading(false);
      return;
    }
    getCargos({ data: onboardingData.secretaria_id })
      .then((rows) => setCargos(((rows || []) as Cargo[]) ?? []))
      .catch(() => setCargos([]))
      .finally(() => setLoading(false));
  }, [onboardingData.secretaria_id]);

  /** Nomes únicos: cargos cadastrados + típicos da área. */
  const opcoes = useMemo(() => {
    const doBanco = Array.from(new Set(cargos.map((c) => c.nome)));
    const tipicos = CARGOS_POR_AREA[areaDaSecretaria(onboardingData.secretaria_nome || '')] ?? [];
    const extras = tipicos.filter(
      (t) => !doBanco.some((n) => n.toLowerCase() === t.toLowerCase())
    );
    return [...doBanco, ...extras];
  }, [cargos, onboardingData.secretaria_nome]);

  const selecionar = (nome: string) => {
    const doBanco = cargos.find((c) => c.nome.toLowerCase() === nome.toLowerCase());
    updateData({
      cargo_id: doBanco?.id,
      funcao: nome,
      ...(doBanco ? {} : { unidades_ids: [] }),
    });
    nextStep();
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
      <h2 className="text-question mb-6">Qual o seu cargo ou função?</h2>

      <div className="space-y-3">
        {opcoes.map((nome) => (
          <button
            key={nome}
            onClick={() => selecionar(nome)}
            className="w-full card-intergo p-5 text-left active:scale-[0.98] transition-transform"
          >
            <span className="text-body font-semibold">{nome}</span>
          </button>
        ))}

        {!outro ? (
          <button
            onClick={() => setOutro(true)}
            className="w-full card-intergo p-5 text-left active:scale-[0.98] transition-transform"
          >
            <span className="text-body font-semibold">Outro (citar)</span>
          </button>
        ) : (
          <div className="card-intergo p-5 space-y-3">
            <label className="text-label text-secondary block">Qual a sua função?</label>
            <input
              type="text"
              placeholder="Ex: Motorista escolar"
              className="input-field"
              value={nomeOutro}
              onChange={(e) => setNomeOutro(e.target.value)}
              autoFocus
            />
            <button
              onClick={() => selecionar(nomeOutro.trim())}
              disabled={nomeOutro.trim().length < 3}
              className="btn-primary"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
