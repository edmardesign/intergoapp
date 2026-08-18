-- Atualizar enum de tipos de mensagem se necessário (ou recriar tabela)
DO $$ BEGIN
    CREATE TYPE public.mensagem_tipo AS ENUM ('comunicado', 'demanda', 'reuniao', 'evento');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Recriar/Atualizar tabela mensagens
CREATE TABLE IF NOT EXISTS public.mensagens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo public.mensagem_tipo NOT NULL,
    remetente_id UUID NOT NULL REFERENCES auth.users(id),
    assunto TEXT,
    corpo TEXT,
    prazo DATE,
    data_evento DATE,
    hora_evento TIME,
    local_evento TEXT,
    exige_confirmacao BOOLEAN DEFAULT false,
    urgente BOOLEAN DEFAULT false,
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- Recriar/Atualizar tabela mensagem_destinatarios
CREATE TABLE IF NOT EXISTS public.mensagem_destinatarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mensagem_id UUID NOT NULL REFERENCES public.mensagens(id) ON DELETE CASCADE,
    destinatario_id UUID NOT NULL REFERENCES auth.users(id),
    entregue_em TIMESTAMPTZ,
    lido_em TIMESTAMPTZ,
    confirmado_em TIMESTAMPTZ,
    UNIQUE(mensagem_id, destinatario_id)
);

-- Garantir que a tabela anexos suporte mensagens e solicitações
CREATE TABLE IF NOT EXISTS public.anexos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mensagem_id UUID REFERENCES public.mensagens(id) ON DELETE CASCADE,
    solicitacao_id UUID REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    tipo TEXT,
    nome_arquivo TEXT NOT NULL,
    tamanho INTEGER,
    criado_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagem_destinatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON public.mensagens TO authenticated;
GRANT ALL ON public.mensagem_destinatarios TO authenticated;
GRANT ALL ON public.anexos TO authenticated;
GRANT ALL ON public.mensagens TO service_role;
GRANT ALL ON public.mensagem_destinatarios TO service_role;
GRANT ALL ON public.anexos TO service_role;

-- Políticas
DROP POLICY IF EXISTS "Mensagens: remetente vê as suas" ON public.mensagens;
CREATE POLICY "Mensagens: remetente vê as suas" ON public.mensagens
FOR ALL TO authenticated USING (remetente_id = auth.uid());

DROP POLICY IF EXISTS "Mensagens: destinatário vê as recebidas" ON public.mensagens;
CREATE POLICY "Mensagens: destinatário vê as recebidas" ON public.mensagens
FOR SELECT TO authenticated USING (
    id IN (SELECT mensagem_id FROM public.mensagem_destinatarios WHERE destinatario_id = auth.uid())
);

DROP POLICY IF EXISTS "Destinatarios: visibilidade" ON public.mensagem_destinatarios;
CREATE POLICY "Destinatarios: visibilidade" ON public.mensagem_destinatarios
FOR ALL TO authenticated USING (
    destinatario_id = auth.uid() OR 
    mensagem_id IN (SELECT id FROM public.mensagens WHERE remetente_id = auth.uid())
);

DROP POLICY IF EXISTS "Anexos: visibilidade" ON public.anexos;
CREATE POLICY "Anexos: visibilidade" ON public.anexos
FOR ALL TO authenticated USING (
    mensagem_id IN (SELECT id FROM public.mensagens WHERE remetente_id = auth.uid()) OR
    mensagem_id IN (SELECT mensagem_id FROM public.mensagem_destinatarios WHERE destinatario_id = auth.uid()) OR
    solicitacao_id IS NOT NULL
);

-- Adicionar coluna pode_enviar_descendente na tabela cargos se não existir
ALTER TABLE public.cargos ADD COLUMN IF NOT EXISTS pode_enviar_descendente BOOLEAN DEFAULT false;

-- Atualizar cargos da Educação para permitir envio
UPDATE public.cargos SET pode_enviar_descendente = true 
WHERE nome IN ('Prefeito', 'Secretário', 'Coordenador', 'Diretor', 'Vice-Diretor');
