import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, ImagePlus, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { enviarMensagemHierarquica, getDestinosHierarquicos, type CargoDestino } from '@/lib/hierarquia-mensagens';

export const Route = createFileRoute('/enviar/mensagem')({
  component: EnviarMensagemPage,
});

interface Subordinado {
  id: string;
  nome_completo: string;
  cargo?: { nome: string } | null;
}

function EnviarMensagemPage() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [cargos, setCargos] = useState<CargoDestino[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [texto, setTexto] = useState('');
  const [imagem, setImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const carregar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: '/login' });
        return;
      }
      const destinos = await getDestinosHierarquicos();
      setCargos(destinos.cargos);
      setCarregando(false);
    };
    carregar();
  }, [navigate]);

  const todos = cargos.length > 0 && selecionados.length === cargos.length;
  const cargosSelecionados = useMemo(() => new Set(selecionados), [selecionados]);

  const alternar = (id: string) =>
    setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const escolherImagem = (file: File | null) => {
    setImagem(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const enviar = async () => {
    if (!texto.trim() || selecionados.length === 0) return;
    setEnviando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('sem sessão');

      let imagem_url: string | null = null;
      if (imagem) {
        const caminho = `${session.user.id}/${Date.now()}-${imagem.name}`;
        const { error: upErr } = await supabase.storage
          .from('mensagens-imagens')
          .upload(caminho, imagem);
        if (upErr) throw upErr;
        imagem_url = caminho;
      }

       await enviarMensagemHierarquica({
         tipo: 'comunicado',
         payload: {
            assunto: (texto.trim().split('\n')[0] ?? 'Mensagem').slice(0, 60),
            corpo: texto.trim(),
            imagem: imagem_url,
         },
         cargos: selecionados,
       });

      toast.success('Mensagem enviada.');
      navigate({ to: '/enviadas' });
    } catch (e) {
      console.error(e);
      toast.error('Não foi possível enviar agora. Tente novamente em instantes.');
    }
    setEnviando(false);
  };

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-40 pt-6">
      <button
        type="button"
        onClick={() => navigate({ to: '/enviar' })}
        className="mb-4 flex items-center gap-1 text-[15px] font-medium text-primary active:opacity-60"
      >
        <ArrowLeft size={18} /> Voltar
      </button>

      <h1 className="mb-5 text-[28px] font-bold leading-[34px]">Enviar mensagem</h1>

       {cargos.length === 0 ? (
        <div className="rounded-2xl bg-card p-4 text-[15px] text-secondary">
           Seu cargo ainda não possui funções subordinadas configuradas.
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-2xl bg-card p-2">
            <label className="flex items-center gap-3 rounded-xl p-3">
              <input
                type="checkbox"
                className="h-5 w-5 accent-primary"
                checked={todos}
                 onChange={() => setSelecionados(todos ? [] : cargos.map((cargo) => cargo.id))}
              />
              <span className="text-[15px] font-semibold">Selecionar todos</span>
            </label>
             {cargos.map((cargo) => (
               <label key={cargo.id} className="flex items-center gap-3 rounded-xl p-3">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-primary"
                   checked={cargosSelecionados.has(cargo.id)}
                   onChange={() => alternar(cargo.id)}
                />
                <span className="flex flex-col">
                  <span className="text-[15px]">
                     {cargo.nome}
                  </span>
                   <span className="text-[13px] text-secondary">Ocupantes atuais e futuros</span>
                </span>
              </label>
            ))}
          </section>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva sua mensagem"
            className="min-h-[140px] w-full resize-none rounded-2xl bg-card p-4 text-[17px] outline-none focus:ring-2 focus:ring-primary"
          />

          {preview ? (
            <div className="relative">
              <img src={preview} alt="Pré-visualização" className="w-full rounded-2xl" />
              <button
                type="button"
                onClick={() => escolherImagem(null)}
                className="absolute right-3 top-3 rounded-full bg-background/90 p-2"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-card p-4 text-[15px] text-primary">
              <ImagePlus size={18} /> Adicionar imagem (opcional)
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => escolherImagem(e.target.files?.[0] ?? null)}
              />
            </label>
          )}

          <button
            type="button"
            onClick={enviar}
            disabled={enviando || !texto.trim() || selecionados.length === 0}
            className="btn-primary disabled:opacity-40"
          >
            {enviando ? <Loader2 className="mx-auto animate-spin" /> : 'Enviar'}
          </button>
        </div>
      )}
    </div>
  );
}
