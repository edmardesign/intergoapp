-- RLS for Auditoria
GRANT SELECT, INSERT ON public.auditoria TO authenticated;
GRANT ALL ON public.auditoria TO service_role;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_view_auditoria" ON public.auditoria;
CREATE POLICY "admin_view_auditoria" ON public.auditoria FOR SELECT TO authenticated USING (true);

-- Solicitacoes tables and types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'solicitacao_status') THEN
        CREATE TYPE public.solicitacao_status AS ENUM ('pendente', 'em_analise', 'aprovado', 'negado', 'encaminhado', 'concluido');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'solicitacao_urgencia') THEN
        CREATE TYPE public.solicitacao_urgencia AS ENUM ('baixa', 'media', 'alta', 'critica');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'solicitacao_acao') THEN
        CREATE TYPE public.solicitacao_acao AS ENUM ('criou', 'analisou', 'aprovou', 'negou', 'encaminhou', 'concluiu');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.solicitacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitante_id UUID NOT NULL REFERENCES public.perfis(id),
    responsavel_atual_id UUID NOT NULL REFERENCES public.perfis(id),
    item TEXT NOT NULL,
    quantidade NUMERIC NOT NULL,
    unidade_medida TEXT NOT NULL,
    justificativa TEXT,
    urgencia public.solicitacao_urgencia DEFAULT 'media',
    status public.solicitacao_status DEFAULT 'pendente',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.solicitacao_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
    autor_id UUID NOT NULL REFERENCES public.perfis(id),
    acao public.solicitacao_acao NOT NULL,
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grants for Solicitacoes
GRANT SELECT, INSERT, UPDATE ON public.solicitacoes TO authenticated;
GRANT SELECT, INSERT ON public.solicitacao_eventos TO authenticated;
GRANT ALL ON public.solicitacoes TO service_role;
GRANT ALL ON public.solicitacao_eventos TO service_role;

-- RLS for Solicitacoes
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solicitacoes_isolation" ON public.solicitacoes;
CREATE POLICY "solicitacoes_isolation" ON public.solicitacoes FOR SELECT TO authenticated USING (
    auth.uid() = solicitante_id OR 
    auth.uid() = responsavel_atual_id OR
    EXISTS (SELECT 1 FROM public.perfis p WHERE p.id = solicitacoes.solicitante_id AND p.superior_id = auth.uid())
);

-- Helper function
CREATE OR REPLACE FUNCTION public.get_nome_aprovador(perfil_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    superior_name TEXT;
BEGIN
    SELECT p.nome_completo INTO superior_name
    FROM public.perfis p
    JOIN public.perfis sub ON sub.superior_id = p.id
    WHERE sub.id = perfil_uuid;
    
    RETURN COALESCE(superior_name, 'Direção Central');
END;
$$;
