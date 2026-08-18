-- Segurança para tabelas de referência
GRANT SELECT ON public.estados TO authenticated;
GRANT SELECT ON public.municipios TO authenticated;
GRANT SELECT ON public.secretarias TO authenticated;
GRANT SELECT ON public.unidades TO authenticated;
GRANT SELECT ON public.cargos TO authenticated;

-- RLS para solicitacao_eventos (acesso vinculado à solicitação)
ALTER TABLE public.solicitacao_eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solicitacao_eventos_isolation" ON public.solicitacao_eventos;
CREATE POLICY "solicitacao_eventos_isolation" ON public.solicitacao_eventos FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.solicitacoes s
        WHERE s.id = solicitacao_eventos.solicitacao_id
        AND (
            auth.uid() = s.solicitante_id OR 
            auth.uid() = s.responsavel_atual_id OR
            EXISTS (SELECT 1 FROM public.perfis p WHERE p.id = s.solicitante_id AND p.superior_id = auth.uid())
        )
    )
);

-- RLS para perfil_unidades
ALTER TABLE public.perfil_unidades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "perfil_unidades_read" ON public.perfil_unidades;
CREATE POLICY "perfil_unidades_read" ON public.perfil_unidades FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, DELETE ON public.perfil_unidades TO authenticated;
