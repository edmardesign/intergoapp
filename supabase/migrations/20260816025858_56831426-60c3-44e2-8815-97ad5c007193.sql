-- Enums
CREATE TYPE public.solicitacao_status AS ENUM ('solicitado','em_analise','aprovado','negado','entregue');
CREATE TYPE public.solicitacao_urgencia AS ENUM ('normal','urgente');
CREATE TYPE public.solicitacao_acao AS ENUM ('criou','encaminhou','aprovou','negou','entregou');

CREATE TABLE public.solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_id uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  responsavel_atual_id uuid REFERENCES public.perfis(id) ON DELETE SET NULL,
  item text NOT NULL,
  quantidade numeric(12,2) NOT NULL CHECK (quantidade > 0),
  unidade_medida text NOT NULL,
  justificativa text NOT NULL,
  urgencia public.solicitacao_urgencia NOT NULL DEFAULT 'normal',
  status public.solicitacao_status NOT NULL DEFAULT 'solicitado',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.solicitacoes TO authenticated;
GRANT ALL ON public.solicitacoes TO service_role;
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.solicitacao_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id uuid NOT NULL REFERENCES public.solicitacoes(id) ON DELETE CASCADE,
  autor_id uuid NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  acao public.solicitacao_acao NOT NULL,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.solicitacao_eventos TO authenticated;
GRANT ALL ON public.solicitacao_eventos TO service_role;
ALTER TABLE public.solicitacao_eventos ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_solic_solicitante ON public.solicitacoes(solicitante_id);
CREATE INDEX idx_solic_responsavel ON public.solicitacoes(responsavel_atual_id);
CREATE INDEX idx_solic_eventos_sid ON public.solicitacao_eventos(solicitacao_id);
CREATE INDEX idx_solic_eventos_autor ON public.solicitacao_eventos(autor_id);

-- Helpers (security definer evita recursao entre as duas policies)
CREATE OR REPLACE FUNCTION public.solic_participou(_solicitacao_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.solicitacao_eventos e
    WHERE e.solicitacao_id = _solicitacao_id AND e.autor_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.solic_envolvido(_solicitacao_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.solicitacoes s
    WHERE s.id = _solicitacao_id
      AND (s.solicitante_id = _user_id OR s.responsavel_atual_id = _user_id)
  );
$$;

CREATE POLICY "Envolvidos veem solicitacoes" ON public.solicitacoes
  FOR SELECT TO authenticated
  USING (solicitante_id = auth.uid() OR responsavel_atual_id = auth.uid()
         OR public.solic_participou(id, auth.uid()));

CREATE POLICY "Usuario cria a propria solicitacao" ON public.solicitacoes
  FOR INSERT TO authenticated
  WITH CHECK (solicitante_id = auth.uid());

CREATE POLICY "Responsavel atual atualiza solicitacao" ON public.solicitacoes
  FOR UPDATE TO authenticated
  USING (responsavel_atual_id = auth.uid())
  WITH CHECK (true);

CREATE POLICY "Envolvidos veem eventos" ON public.solicitacao_eventos
  FOR SELECT TO authenticated
  USING (autor_id = auth.uid() OR public.solic_envolvido(solicitacao_id, auth.uid()));

CREATE POLICY "Autor registra evento" ON public.solicitacao_eventos
  FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid() AND public.solic_envolvido(solicitacao_id, auth.uid()));

-- Anexos tambem podem pertencer a uma solicitacao
ALTER TABLE public.anexos ALTER COLUMN mensagem_id DROP NOT NULL;
ALTER TABLE public.anexos ADD COLUMN solicitacao_id uuid REFERENCES public.solicitacoes(id) ON DELETE CASCADE;
CREATE INDEX idx_anexos_solicitacao ON public.anexos(solicitacao_id);

CREATE POLICY "Anexos de solicitacao visiveis aos envolvidos" ON public.anexos
  FOR SELECT TO authenticated
  USING (solicitacao_id IS NOT NULL AND (
    public.solic_envolvido(solicitacao_id, auth.uid())
    OR public.solic_participou(solicitacao_id, auth.uid())
  ));

CREATE POLICY "Solicitante anexa no proprio pedido" ON public.anexos
  FOR INSERT TO authenticated
  WITH CHECK (solicitacao_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.solicitacoes s
    WHERE s.id = solicitacao_id AND s.solicitante_id = auth.uid()
  ));

CREATE OR REPLACE FUNCTION public.solicitacoes_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_solicitacoes_touch BEFORE UPDATE ON public.solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.solicitacoes_touch();

ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitacoes;