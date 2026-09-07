DROP POLICY IF EXISTS "Solicitacoes visibilidade" ON public.solicitacoes;
DROP POLICY IF EXISTS "solicitacoes_isolation" ON public.solicitacoes;
DROP POLICY IF EXISTS "solicitacao_eventos_isolation" ON public.solicitacao_eventos;
DROP POLICY IF EXISTS "Mensagens visibilidade" ON public.mensagens;
DROP POLICY IF EXISTS "Mensagens: destinatário vê as recebidas" ON public.mensagens;
DROP POLICY IF EXISTS "Mensagens: remetente vê as suas" ON public.mensagens;
DROP POLICY IF EXISTS "Destinatarios: visibilidade" ON public.mensagem_destinatarios;

CREATE POLICY "Superior ve solicitacoes da equipe"
ON public.solicitacoes FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.perfis p WHERE p.id = solicitacoes.solicitante_id AND p.superior_id = auth.uid()));

CREATE POLICY "Remetente gerencia suas mensagens"
ON public.mensagens FOR UPDATE TO authenticated
USING (remetente_id = auth.uid()) WITH CHECK (remetente_id = auth.uid());