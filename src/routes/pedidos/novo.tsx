import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, Loader2, Package, AlertCircle } from 'lucide-react';
import { createSolicitacao } from '@/lib/solicitacoes.functions';

export const Route = createFileRoute('/pedidos/novo')({
  component: NovoPedido,
});

function NovoPedido() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    item: '',
    quantidade: 1,
    unidade_medida: 'Unidade',
    justificativa: '',
    urgencia: 'media' as any
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createSolicitacao({ data: form });
      navigate({ to: '/pedidos' } as any);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar pedido. Verifique se você tem um superior cadastrado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background animate-in slide-in-from-bottom duration-300">
      <header className="p-4 flex items-center bg-white border-b sticky top-0 z-10">
        <button onClick={() => window.history.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="flex-1 text-center font-bold text-lg">Novo Pedido</h1>
        <div className="w-10" />
      </header>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 pb-32">
        <div className="space-y-4">
          <div>
            <label className="text-label text-secondary mb-2 block">Item solicitado</label>
            <input 
              required
              className="input-field"
              placeholder="Ex: Resma de papel A4"
              value={form.item}
              onChange={e => setForm({...form, item: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-label text-secondary mb-2 block">Quantidade</label>
              <input 
                required
                type="number"
                className="input-field"
                value={form.quantidade}
                onChange={e => setForm({...form, quantidade: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-label text-secondary mb-2 block">Medida</label>
              <select 
                className="input-field appearance-none"
                value={form.unidade_medida}
                onChange={e => setForm({...form, unidade_medida: e.target.value})}
              >
                <option>Unidade</option>
                <option>Caixa</option>
                <option>Pacote</option>
                <option>Litro</option>
                <option>Kg</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-label text-secondary mb-2 block">Urgência</label>
            <div className="grid grid-cols-4 gap-2">
              {['baixa', 'media', 'alta', 'critica'].map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setForm({...form, urgencia: u})}
                  className={`h-10 rounded-lg text-[12px] font-bold border ${form.urgencia === u ? 'bg-primary text-white border-primary' : 'bg-white text-secondary border-border'}`}
                >
                  {u.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-label text-secondary mb-2 block">Justificativa</label>
            <textarea 
              required
              className="w-full min-h-[120px] bg-[#F2F2F7] border-none rounded-[10px] p-4 text-[17px] focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none"
              placeholder="Por que este material é necessário?"
              value={form.justificativa}
              onChange={e => setForm({...form, justificativa: e.target.value})}
            />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl flex gap-3">
          <AlertCircle className="text-primary shrink-0" size={20} />
          <p className="text-[13px] text-primary/80">
            Sua solicitação será enviada automaticamente para seu superior imediato para análise.
          </p>
        </div>

        <div className="fixed bottom-8 left-5 right-5">
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Enviar Solicitação'}
          </button>
        </div>
      </form>
    </div>
  );
}
