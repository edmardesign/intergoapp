-- 1) Novo tipo de mensagem
ALTER TYPE public.mensagem_tipo ADD VALUE IF NOT EXISTS 'boas_vindas';

-- 2) Preenchimento automático do superior
CREATE OR REPLACE FUNCTION public.trg_perfis_backfill_superior()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cargo_sup uuid;
BEGIN
  IF NEW.superior_id IS NOT NULL THEN RETURN NEW; END IF;

  SELECT c.cargo_superior_id INTO v_cargo_sup
  FROM public.cargos c WHERE c.id = NEW.nivel_id;

  IF v_cargo_sup IS NULL THEN RETURN NEW; END IF;

  SELECT sp.id INTO NEW.superior_id
  FROM public.perfis sp
  WHERE sp.nivel_id = v_cargo_sup
    AND sp.status = 'ativo'
    AND (sp.municipio_id IS NULL OR NEW.municipio_id IS NULL OR sp.municipio_id = NEW.municipio_id)
    AND (sp.secretaria_id IS NULL OR NEW.secretaria_id IS NULL OR sp.secretaria_id = NEW.secretaria_id)
  ORDER BY sp.created_at ASC
  LIMIT 1;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_perfis_backfill_superior ON public.perfis;
CREATE TRIGGER trg_perfis_backfill_superior
BEFORE INSERT ON public.perfis
FOR EACH ROW EXECUTE FUNCTION public.trg_perfis_backfill_superior();

-- 3) Mensagem de boas-vindas
CREATE OR REPLACE FUNCTION public.criar_mensagem_boas_vindas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_sistema uuid;
  v_msg uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Nao autenticado'; END IF;

  SELECT id INTO v_sistema FROM public.perfis WHERE nome_completo = 'INTERGO' LIMIT 1;
  IF v_sistema IS NULL THEN RETURN; END IF;

  IF EXISTS (
    SELECT 1 FROM public.mensagem_destinatarios md
    JOIN public.mensagens m ON m.id = md.mensagem_id
    WHERE md.destinatario_id = v_uid AND m.tipo = 'boas_vindas'
  ) THEN RETURN; END IF;

  INSERT INTO public.mensagens (remetente_id, tipo, payload, exigir_confirmacao, urgente)
  VALUES (
    v_sistema,
    'boas_vindas',
    jsonb_build_object(
      'assunto', 'Bem-vindo(a) ao INTERGO!',
      'corpo', 'Bem-vindo(a) ao INTERGO! Aqui você recebe comunicados do(a) seu(sua) superior e envia solicitações.'
    ),
    false, false
  )
  RETURNING id INTO v_msg;

  INSERT INTO public.mensagem_destinatarios (mensagem_id, destinatario_id, entregue_em)
  VALUES (v_msg, v_uid, now());
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_mensagem_boas_vindas() TO authenticated;

-- 4) Estatísticas da equipe
CREATE OR REPLACE FUNCTION public.get_equipe_stats(p_superior_id uuid)
RETURNS TABLE (perfil_id uuid, nome text, recebidas int, lidas int, enviadas int, solicitacoes int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.nome_completo,
    (SELECT count(*)::int FROM public.mensagem_destinatarios md WHERE md.destinatario_id = p.id),
    (SELECT count(*)::int FROM public.mensagem_destinatarios md WHERE md.destinatario_id = p.id AND md.lido_em IS NOT NULL),
    (SELECT count(*)::int FROM public.mensagens m WHERE m.remetente_id = p.id),
    (SELECT count(*)::int FROM public.solicitacoes s WHERE s.solicitante_id = p.id)
  FROM public.perfis p
  WHERE p.superior_id = p_superior_id
  ORDER BY p.nome_completo;
$$;

GRANT EXECUTE ON FUNCTION public.get_equipe_stats(uuid) TO authenticated;

-- 5) Envio restrito a quem tem subordinados
DROP POLICY IF EXISTS "Users can send messages" ON public.mensagens;
CREATE POLICY "Envio somente com subordinados"
ON public.mensagens FOR INSERT TO authenticated
WITH CHECK (
  remetente_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.perfis sub WHERE sub.superior_id = auth.uid())
);

-- 6) Storage: imagens de mensagens
DROP POLICY IF EXISTS "mensagens_imagens_leitura" ON storage.objects;
CREATE POLICY "mensagens_imagens_leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'mensagens-imagens');

DROP POLICY IF EXISTS "mensagens_imagens_upload" ON storage.objects;
CREATE POLICY "mensagens_imagens_upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'mensagens-imagens');