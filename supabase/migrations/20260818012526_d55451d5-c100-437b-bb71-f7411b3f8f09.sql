-- RLS Adicional (Mensagens e Solicitações)
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagem_destinatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;

-- Grant permissions if missing
GRANT SELECT ON public.mensagens TO authenticated;
GRANT SELECT ON public.mensagem_destinatarios TO authenticated;
GRANT SELECT ON public.solicitacoes TO authenticated;

DROP POLICY IF EXISTS "Mensagens visibilidade" ON public.mensagens;
CREATE POLICY "Mensagens visibilidade" ON public.mensagens
FOR SELECT TO authenticated
USING (
  remetente_id = auth.uid() OR
  id IN (SELECT mensagem_id FROM public.mensagem_destinatarios WHERE destinatario_id = auth.uid())
);

DROP POLICY IF EXISTS "Solicitacoes visibilidade" ON public.solicitacoes;
CREATE POLICY "Solicitacoes visibilidade" ON public.solicitacoes
FOR SELECT TO authenticated
USING (
  solicitante_id = auth.uid() OR
  responsavel_atual_id = auth.uid() OR
  id IN (SELECT solicitacao_id FROM public.solicitacao_eventos WHERE autor_id = auth.uid())
);

-- Segurança de lotação Coordenador
CREATE OR REPLACE FUNCTION public.can_edit_lotacao(target_perfil_id UUID) 
RETURNS BOOLEAN AS $$
DECLARE
    is_coord BOOLEAN;
BEGIN
    -- Check if target is a Coordinator
    SELECT EXISTS (
        SELECT 1 FROM public.perfis p
        JOIN public.cargos c ON p.nivel_id = c.id
        WHERE p.id = target_perfil_id AND c.nome = 'Coordenador'
    ) INTO is_coord;

    -- If target is Coordinator, only Secretary can edit
    IF is_coord THEN
        RETURN public.is_secretario(auth.uid());
    END IF;

    -- Otherwise, self or Secretary
    RETURN target_perfil_id = auth.uid() OR public.is_secretario(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Secretário gerencia lotação de coordenadores" ON public.perfil_unidades;
DROP POLICY IF EXISTS "Lotações leitura autenticada" ON public.perfil_unidades;
CREATE POLICY "Lotação regras específicas" ON public.perfil_unidades
FOR ALL TO authenticated
USING (public.can_edit_lotacao(perfil_id));
