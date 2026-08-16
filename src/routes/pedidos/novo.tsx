import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, Loader2, Paperclip, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'
import { criarPedido, getMeuContexto, UNIDADES_MEDIDA, type MeuContexto } from '@/lib/pedidos'

export const Route = createFileRoute('/pedidos/novo')({
  head: () => ({
    meta: [
      { title: 'Novo pedido de material | INTERGO' },
      {
        name: 'description',
        content:
          'Crie um pedido de material com item, quantidade, justificativa e anexos. Ele segue direto para o seu superior.',
      },
      { property: 'og:title', content: 'Novo pedido de material | INTERGO' },
      {
        property: 'og:description',
        content: 'Registre um pedido de material e envie para o seu superior no INTERGO.',
      },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: NovoPedidoComponent,
})

interface AnexoLocal {
  nome: string
  url: string
  tamanho: number
  tipo_mime: string
}

const MAX_JUSTIFICATIVA = 300
const MIN_JUSTIFICATIVA = 20

function NovoPedidoComponent() {
  const navigate = useNavigate()
  const inputFile = useRef<HTMLInputElement>(null)

  const [ctx, setCtx] = useState<MeuContexto | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [item, setItem] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [unidade, setUnidade] = useState(UNIDADES_MEDIDA[0]!)
  const [justificativa, setJustificativa] = useState('')
  const [urgente, setUrgente] = useState(false)
  const [anexos, setAnexos] = useState<AnexoLocal[]>([])
  const [uploading, setUploading] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [tocado, setTocado] = useState<Record<string, boolean>>({})

  useEffect(() => {
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        navigate({ to: '/login' })
        return
      }
      try {
        const c = await getMeuContexto(session.user.id)
        setCtx(c)
        if (!c.podeCriar) toast('Prefeito não solicita — recebe.')
      } catch (err: any) {
        toast.error(err?.message ?? 'Não foi possível carregar seus dados.')
      } finally {
        setCarregando(false)
      }
    })()
  }, [navigate])

  const qtdNum = Number(String(quantidade).replace(',', '.'))
  const erroItem = tocado['item'] && !item.trim() ? 'Informe o item.' : ''
  const erroQtd =
    tocado['qtd'] && (!quantidade || !Number.isFinite(qtdNum) || qtdNum <= 0)
      ? 'Informe uma quantidade maior que zero.'
      : ''
  const erroJust =
    tocado['just'] && justificativa.trim().length < MIN_JUSTIFICATIVA
      ? `Escreva pelo menos ${MIN_JUSTIFICATIVA} caracteres.`
      : ''

  const valido =
    !!item.trim() &&
    Number.isFinite(qtdNum) &&
    qtdNum > 0 &&
    justificativa.trim().length >= MIN_JUSTIFICATIVA &&
    !!ctx?.superior_id

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (anexos.length + files.length > 5) {
      toast.error('Máximo de 5 anexos permitidos.')
      return
    }
    setUploading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Arquivo ${file.name} excede 10MB.`)
          continue
        }
        const path = `${session.user.id}/${Date.now()}_${file.name}`
        const { error } = await supabase.storage.from('anexos').upload(path, file)
        if (error) throw error
        setAnexos((a) => [
          ...a,
          { nome: file.name, url: path, tamanho: file.size, tipo_mime: file.type },
        ])
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro no upload.')
    } finally {
      setUploading(false)
      if (inputFile.current) inputFile.current.value = ''
    }
  }

  const enviar = async () => {
    if (!ctx?.superior_id || !valido) return
    setEnviando(true)
    try {
      const id = await criarPedido(ctx.id, ctx.superior_id, {
        item,
        quantidade: qtdNum,
        unidade_medida: unidade,
        justificativa,
        urgente,
        anexos,
      })
      navigate({ to: '/pedidos/$id', params: { id } })
    } catch (err: any) {
      toast.error(err?.message ?? 'Não foi possível enviar o pedido.')
      setEnviando(false)
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen space-y-3 bg-background p-5">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      </div>
    )
  }

  if (!ctx?.podeCriar) {
    return (
      <div className="min-h-screen bg-background p-5">
        <button
          type="button"
          onClick={() => navigate({ to: '/pedidos' })}
          className="mb-4 inline-flex items-center gap-1 text-[15px] text-primary"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
          Pedidos
        </button>
        <p className="rounded-2xl bg-card p-4 text-[15px] text-secondary">
          Prefeito não solicita — recebe.
        </p>
      </div>
    )
  }

  const rotulo = 'mb-2 block text-[13px] font-semibold uppercase tracking-wide text-secondary'
  const campo =
    'w-full rounded-xl bg-card px-4 py-3 text-[16px] text-foreground outline-none ring-1 ring-inset ring-transparent focus:ring-primary'

  return (
    <div className="min-h-screen bg-background pb-40">
      <header className="px-5 pb-2 pt-6">
        <button
          type="button"
          onClick={() => navigate({ to: '/pedidos' })}
          className="mb-3 inline-flex items-center gap-1 text-[15px] text-primary"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
          Pedidos
        </button>
        <h1 className="text-[28px] font-bold leading-tight text-foreground">Novo pedido</h1>
      </header>

      <main className="space-y-6 px-5 py-4">
        <div>
          <label className={rotulo} htmlFor="item">
            1. Item
          </label>
          <input
            id="item"
            className={campo}
            maxLength={60}
            value={item}
            onChange={(e) => {
              setItem(e.target.value)
              setTocado((t) => ({ ...t, item: true }))
            }}
            placeholder="Ex.: Papel sulfite A4"
          />
          {erroItem && <p className="mt-1 text-[13px] text-[#FF3B30]">{erroItem}</p>}
        </div>

        <div>
          <label className={rotulo} htmlFor="qtd">
            2. Quantidade
          </label>
          <div className="flex gap-2">
            <input
              id="qtd"
              inputMode="decimal"
              className={cn(campo, 'flex-1')}
              value={quantidade}
              onChange={(e) => {
                setQuantidade(e.target.value)
                setTocado((t) => ({ ...t, qtd: true }))
              }}
              placeholder="0"
            />
            <select
              className={cn(campo, 'w-36')}
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              aria-label="Unidade de medida"
            >
              {UNIDADES_MEDIDA.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          {erroQtd && <p className="mt-1 text-[13px] text-[#FF3B30]">{erroQtd}</p>}
        </div>

        <div>
          <label className={rotulo} htmlFor="just">
            3. Justificativa
          </label>
          <textarea
            id="just"
            rows={5}
            maxLength={MAX_JUSTIFICATIVA}
            className={cn(campo, 'resize-none leading-[21px]')}
            value={justificativa}
            onChange={(e) => {
              setJustificativa(e.target.value)
              setTocado((t) => ({ ...t, just: true }))
            }}
            placeholder="Explique por que isso é necessário. Quem lê está a 1-2 níveis acima e precisa do contexto pra decidir."
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[13px] text-[#FF3B30]">{erroJust}</span>
            <span className="text-[13px] text-secondary">
              {justificativa.length}/{MAX_JUSTIFICATIVA}
            </span>
          </div>
        </div>

        <div>
          <span className={rotulo}>4. Urgência</span>
          <button
            type="button"
            onClick={() => setUrgente((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl bg-card px-4 py-3"
            aria-pressed={urgente}
          >
            <span className="text-[16px] text-foreground">Marcar como urgente</span>
            <span
              className={cn(
                'relative h-[31px] w-[51px] rounded-full transition-colors',
                urgente ? 'bg-primary' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-all',
                  urgente ? 'left-[22px]' : 'left-[2px]',
                )}
              />
            </span>
          </button>
          {urgente && (
            <p className="mt-2 text-[13px] leading-[18px] text-secondary">
              Urgência aciona notificação extra do seu superior via WhatsApp/SMS.
            </p>
          )}
        </div>

        <div>
          <span className={rotulo}>5. Anexos (opcional)</span>
          <input
            ref={inputFile}
            type="file"
            multiple
            accept="application/pdf,image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={() => inputFile.current?.click()}
            disabled={uploading || anexos.length >= 5}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-card py-3 text-[15px] font-medium text-primary disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Paperclip size={18} strokeWidth={1.5} />
            )}
            Anexar PDF ou imagem
          </button>
          {anexos.length > 0 && (
            <ul className="mt-2 space-y-2">
              {anexos.map((a, i) => (
                <li
                  key={a.url}
                  className="flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-2.5"
                >
                  <span className="truncate text-[14px] text-foreground">{a.nome}</span>
                  <button
                    type="button"
                    aria-label={`Remover ${a.nome}`}
                    onClick={() => setAnexos((list) => list.filter((_, idx) => idx !== i))}
                  >
                    <X size={16} strokeWidth={1.5} className="text-secondary" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t border-[#E5E5EA] bg-background/95 px-5 pb-6 pt-3 backdrop-blur">
        <p className="mb-2 text-[13px] text-secondary">
          Este pedido vai para {ctx.superior?.nome ?? 'seu superior'}
          {ctx.superior?.cargo ? ` (${ctx.superior.cargo})` : ''}.
        </p>
        <button
          type="button"
          disabled={!valido || enviando || uploading}
          onClick={enviar}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-[16px] font-semibold text-primary-foreground disabled:opacity-40"
        >
          {enviando && <Loader2 size={18} className="animate-spin" />}
          Enviar pedido
        </button>
      </footer>
    </div>
  )
}
