import React, { useState, useEffect } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { Loader2 } from 'lucide-react';

export const Step11: React.FC = () => {
  const { data, updateData, nextStep } = useOnboardingStore();
  const [cep, setCep] = useState(data.cep || '');
  const [rua, setRua] = useState(data.logradouro || '');
  const [bairro, setBairro] = useState(data.bairro || '');
  const [num, setNum] = useState(data.numero || '');
  const [complemento, setComplemento] = useState(data.complemento || '');
  const [loading, setLoading] = useState(false);
  const [cepErro, setCepErro] = useState(false);

  useEffect(() => {
    if (cep.length === 9) {
      const fetchCep = async () => {
        setLoading(true);
        try {
          const res = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
          const json = await res.json();
          if (json.erro === true) {
            setCepErro(true);
          } else {
            setCepErro(false);
            setRua(json.logradouro);
            setBairro(json.bairro);
          }
        } catch (e) {
          setCepErro(true);
        } finally {
          setLoading(false);
        }
      };
      fetchCep();
    }
  }, [cep]);

  const handleNext = () => {
    if (cep.length === 9 && rua && num) {
      updateData({
        cep,
        logradouro: rua,
        bairro,
        numero: num,
        complemento,
      });
      nextStep();
    }
  };

  const formatCEP = (val: string) =>
    val.replace(/\D/g, '').substring(0, 8).replace(/(\d{5})(\d)/, '$1-$2');

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-5 duration-300 pb-32">
      <h2 className="text-question mb-6">Onde você mora?</h2>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="tel"
            placeholder="CEP: 00000-000"
            className="input-field"
            value={cep}
            onChange={(e) => setCep(formatCEP(e.target.value))}
          />
          {loading && <Loader2 className="absolute right-4 top-4 animate-spin text-primary" size={20} />}
        </div>
        {cepErro && (
          <p className="text-error text-sm mt-1">CEP não encontrado. Preencha rua e bairro manualmente.</p>
        )}

        <input
          type="text"
          placeholder="Rua / Logradouro"
          className="input-field"
          value={rua}
          onChange={(e) => setRua(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Número"
            className="input-field"
            value={num}
            onChange={(e) => setNum(e.target.value)}
          />
          <input
            type="text"
            placeholder="Bairro"
            className="input-field"
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
          />
        </div>

        <input
          type="text"
          placeholder="Complemento (opcional)"
          className="input-field"
          value={complemento}
          onChange={(e) => setComplemento(e.target.value)}
        />
      </div>

      <div className="fixed bottom-8 left-5 right-5">
        <button
          onClick={handleNext}
          disabled={!rua || !num || cep.length < 9}
          className="btn-primary"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};
