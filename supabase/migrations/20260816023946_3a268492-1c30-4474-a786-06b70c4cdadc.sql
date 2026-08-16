-- Helper: is the caller a mayor (prefeito)?
CREATE OR REPLACE FUNCTION public.painel_is_prefeito(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.perfis p
    LEFT JOIN public.niveis n ON n.id = p.nivel_id
    WHERE p.id = _user_id
      AND p.status = 'ativo'
      AND (coalesce(n.nome, '') ILIKE '%prefeito%')
  );
$$;

-- Helper: solicitacoes aggregates (table may not exist yet -> zeros)
CREATE OR REPLACE FUNCTION public.painel_solicitacoes_stats(
  _municipio_id uuid,
  _secretaria_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF to_regclass('public.solicitacoes') IS NULL THEN
    RETURN jsonb_build_object(
      'disponivel', false,
      'abertas', 0,
      'criticas', 0,
      'por_status', jsonb_build_object(
        'solicitado', 0, 'em_analise', 0, 'aprovado', 0, 'negado', 0, 'entregue', 0
      ),
      'top_criticas', '[]'::jsonb
    );
  END IF;

  EXECUTE $q$
    WITH base AS (
      SELECT s.*, sol.nome_completo AS solicitante_nome, sol.secretaria_id, sol.municipio_id,
             resp.nome_completo AS responsavel_nome
      FROM public.solicitacoes s
      JOIN public.perfis sol ON sol.id = s.solicitante_id
      LEFT JOIN public.perfis resp ON resp.id = s.responsavel_atual_id
      WHERE sol.municipio_id = $1
        AND ($2 IS NULL OR sol.secretaria_id = $2)
    )
    SELECT jsonb_build_object(
      'disponivel', true,
      'abertas', (SELECT count(*) FROM base WHERE status IN ('solicitado','em_analise')),
      'criticas', (SELECT count(*) FROM base
                    WHERE status IN ('solicitado','em_analise')
                      AND created_at < now() - interval '3 days'),
      'por_status', (
        SELECT coalesce(jsonb_object_agg(st, qtd), '{}'::jsonb) FROM (
          SELECT status::text AS st, count(*) AS qtd FROM base GROUP BY status
        ) t
      ),
      'top_criticas', (
        SELECT coalesce(jsonb_agg(x ORDER BY x->>'dias' DESC), '[]'::jsonb) FROM (
          SELECT jsonb_build_object(
                   'id', id,
                   'item', item,
                   'solicitante', solicitante_nome,
                   'responsavel', responsavel_nome,
                   'dias', extract(day from now() - created_at)::int
                 ) AS x
          FROM base
          WHERE status IN ('solicitado','em_analise')
            AND created_at < now() - interval '3 days'
          ORDER BY created_at ASC
          LIMIT 5
        ) y
      )
    )
  $q$
  INTO v_result
  USING _municipio_id, _secretaria_id;

  RETURN coalesce(v_result, '{}'::jsonb);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'disponivel', false,
    'abertas', 0,
    'criticas', 0,
    'por_status', jsonb_build_object('solicitado',0,'em_analise',0,'aprovado',0,'negado',0,'entregue',0),
    'top_criticas', '[]'::jsonb
  );
END;
$$;

-- Painel do Secretario (tambem usado pelo Prefeito para ver uma secretaria)
CREATE OR REPLACE FUNCTION public.painel_secretaria(_secretaria_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_caller record;
  v_target uuid;
  v_sec record;
  v_ativos int;
  v_novos int;
  v_pendentes int;
  v_conf_total int;
  v_conf_ok int;
  v_msgs int;
  v_sparkline jsonb;
  v_unidades jsonb;
  v_solic jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Nao autenticado'; END IF;

  SELECT p.id, p.secretaria_id, p.municipio_id, p.status
    INTO v_caller
  FROM public.perfis p WHERE p.id = v_uid;

  IF v_caller IS NULL OR v_caller.status <> 'ativo' THEN
    RAISE EXCEPTION 'Perfil sem acesso ao painel';
  END IF;

  v_target := coalesce(_secretaria_id, v_caller.secretaria_id);
  IF v_target IS NULL THEN RAISE EXCEPTION 'Secretaria nao definida'; END IF;

  SELECT s.id, s.nome, s.icone, s.municipio_id, m.nome AS municipio_nome, e.sigla AS uf
    INTO v_sec
  FROM public.secretarias s
  JOIN public.municipios m ON m.id = s.municipio_id
  JOIN public.estados e ON e.id = m.estado_id
  WHERE s.id = v_target;

  IF v_sec IS NULL THEN RAISE EXCEPTION 'Secretaria inexistente'; END IF;

  IF NOT (
    v_caller.secretaria_id = v_target
    OR (public.painel_is_prefeito(v_uid) AND v_caller.municipio_id = v_sec.municipio_id)
  ) THEN
    RAISE EXCEPTION 'Sem permissao para este painel';
  END IF;

  SELECT count(*) FILTER (WHERE status = 'ativo'),
         count(*) FILTER (WHERE status = 'ativo' AND created_at > now() - interval '28 days'),
         count(*) FILTER (WHERE status = 'pendente')
    INTO v_ativos, v_novos, v_pendentes
  FROM public.perfis WHERE secretaria_id = v_target;

  SELECT count(*), count(*) FILTER (WHERE md.confirmado_em IS NOT NULL)
    INTO v_conf_total, v_conf_ok
  FROM public.mensagem_destinatarios md
  JOIN public.mensagens ms ON ms.id = md.mensagem_id
  JOIN public.perfis rem ON rem.id = ms.remetente_id
  WHERE rem.secretaria_id = v_target
    AND ms.exigir_confirmacao = true
    AND ms.created_at > now() - interval '7 days';

  SELECT count(*) INTO v_msgs
  FROM public.mensagens ms
  JOIN public.perfis rem ON rem.id = ms.remetente_id
  WHERE rem.secretaria_id = v_target
    AND ms.created_at > now() - interval '30 days';

  SELECT coalesce(jsonb_agg(jsonb_build_object('semana', w.n, 'total', w.total) ORDER BY w.n), '[]'::jsonb)
    INTO v_sparkline
  FROM (
    SELECT g.n,
      (SELECT count(*) FROM public.mensagens ms
        JOIN public.perfis rem ON rem.id = ms.remetente_id
       WHERE rem.secretaria_id = v_target
         AND ms.created_at >= now() - ((g.n + 1) * interval '7 days')
         AND ms.created_at <  now() - (g.n * interval '7 days')) AS total
    FROM generate_series(3, 0, -1) AS g(n)
  ) w;

  SELECT coalesce(jsonb_agg(x ORDER BY (x->>'percentual')::numeric ASC), '[]'::jsonb)
    INTO v_unidades
  FROM (
    SELECT jsonb_build_object(
      'id', u.id,
      'nome', u.nome,
      'total', coalesce(t.total, 0),
      'confirmados', coalesce(t.ok, 0),
      'percentual', CASE WHEN coalesce(t.total,0) = 0 THEN 0
                         ELSE round((t.ok::numeric / t.total) * 100) END
    ) AS x
    FROM public.unidades u
    LEFT JOIN LATERAL (
      SELECT count(*) AS total, count(*) FILTER (WHERE md.confirmado_em IS NOT NULL) AS ok
      FROM public.mensagem_destinatarios md
      JOIN public.mensagens ms ON ms.id = md.mensagem_id
      JOIN public.perfis dest ON dest.id = md.destinatario_id
      WHERE dest.unidade_id = u.id
        AND ms.exigir_confirmacao = true
        AND ms.created_at > now() - interval '7 days'
    ) t ON true
    WHERE u.secretaria_id = v_target
  ) z;

  v_solic := public.painel_solicitacoes_stats(v_sec.municipio_id, v_target);

  RETURN jsonb_build_object(
    'secretaria', jsonb_build_object('id', v_sec.id, 'nome', v_sec.nome, 'icone', v_sec.icone),
    'municipio', v_sec.municipio_nome,
    'uf', v_sec.uf,
    'atualizado_em', now(),
    'somente_leitura', (v_caller.secretaria_id IS DISTINCT FROM v_target),
    'kpis', jsonb_build_object(
      'ativos', v_ativos,
      'novos_28d', v_novos,
      'pendentes', v_pendentes,
      'confirmacao_total', v_conf_total,
      'confirmacao_ok', v_conf_ok,
      'confirmacao_pct', CASE WHEN v_conf_total = 0 THEN NULL
                              ELSE round((v_conf_ok::numeric / v_conf_total) * 100) END,
      'mensagens_30d', v_msgs
    ),
    'solicitacoes', v_solic,
    'unidades', v_unidades,
    'sparkline', v_sparkline
  );
END;
$$;

-- Painel do Prefeito (agregado do municipio)
CREATE OR REPLACE FUNCTION public.painel_prefeito()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_caller record;
  v_mun record;
  v_ativos int; v_novos int; v_pendentes int;
  v_conf_total int; v_conf_ok int; v_msgs int;
  v_secretarias jsonb;
  v_alertas jsonb;
  v_solic jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Nao autenticado'; END IF;
  IF NOT public.painel_is_prefeito(v_uid) THEN RAISE EXCEPTION 'Sem permissao para este painel'; END IF;

  SELECT p.id, p.municipio_id INTO v_caller FROM public.perfis p WHERE p.id = v_uid;
  IF v_caller.municipio_id IS NULL THEN RAISE EXCEPTION 'Municipio nao definido'; END IF;

  SELECT m.id, m.nome, e.sigla AS uf INTO v_mun
  FROM public.municipios m JOIN public.estados e ON e.id = m.estado_id
  WHERE m.id = v_caller.municipio_id;

  SELECT count(*) FILTER (WHERE status = 'ativo'),
         count(*) FILTER (WHERE status = 'ativo' AND created_at > now() - interval '28 days'),
         count(*) FILTER (WHERE status = 'pendente')
    INTO v_ativos, v_novos, v_pendentes
  FROM public.perfis WHERE municipio_id = v_mun.id;

  SELECT count(*), count(*) FILTER (WHERE md.confirmado_em IS NOT NULL)
    INTO v_conf_total, v_conf_ok
  FROM public.mensagem_destinatarios md
  JOIN public.mensagens ms ON ms.id = md.mensagem_id
  JOIN public.perfis rem ON rem.id = ms.remetente_id
  WHERE rem.municipio_id = v_mun.id
    AND ms.exigir_confirmacao = true
    AND ms.created_at > now() - interval '7 days';

  SELECT count(*) INTO v_msgs
  FROM public.mensagens ms
  JOIN public.perfis rem ON rem.id = ms.remetente_id
  WHERE rem.municipio_id = v_mun.id AND ms.created_at > now() - interval '30 days';

  v_solic := public.painel_solicitacoes_stats(v_mun.id, NULL);

  SELECT coalesce(jsonb_agg(x ORDER BY x->>'nome'), '[]'::jsonb) INTO v_secretarias
  FROM (
    SELECT jsonb_build_object(
      'id', s.id,
      'nome', s.nome,
      'icone', s.icone,
      'ativos', coalesce(pc.ativos, 0),
      'pendentes', coalesce(pc.pendentes, 0),
      'confirmacao_total', coalesce(cf.total, 0),
      'confirmacao_pct', CASE WHEN coalesce(cf.total,0) = 0 THEN NULL
                              ELSE round((cf.ok::numeric / cf.total) * 100) END,
      'solicitacoes_abertas', coalesce((public.painel_solicitacoes_stats(s.municipio_id, s.id)->>'abertas')::int, 0),
      'solicitacoes_criticas', coalesce((public.painel_solicitacoes_stats(s.municipio_id, s.id)->>'criticas')::int, 0)
    ) AS x
    FROM public.secretarias s
    LEFT JOIN LATERAL (
      SELECT count(*) FILTER (WHERE p.status = 'ativo') AS ativos,
             count(*) FILTER (WHERE p.status = 'pendente') AS pendentes
      FROM public.perfis p WHERE p.secretaria_id = s.id
    ) pc ON true
    LEFT JOIN LATERAL (
      SELECT count(*) AS total, count(*) FILTER (WHERE md.confirmado_em IS NOT NULL) AS ok
      FROM public.mensagem_destinatarios md
      JOIN public.mensagens ms ON ms.id = md.mensagem_id
      JOIN public.perfis rem ON rem.id = ms.remetente_id
      WHERE rem.secretaria_id = s.id
        AND ms.exigir_confirmacao = true
        AND ms.created_at > now() - interval '7 days'
    ) cf ON true
    WHERE s.municipio_id = v_mun.id
  ) y;

  -- Alertas: unidades com baixa confirmacao + cadastros pendentes ha mais de 48h
  SELECT coalesce(jsonb_agg(a ORDER BY (a->>'severidade') DESC), '[]'::jsonb) INTO v_alertas
  FROM (
    SELECT jsonb_build_object(
      'tipo', 'unidade_confirmacao',
      'severidade', 'alta',
      'titulo', u.nome || ': só ' || round((t.ok::numeric / t.total) * 100) || '% confirmam',
      'detalhe', 'Confirmação abaixo de 30% nos últimos 7 dias.'
    ) AS a
    FROM public.unidades u
    JOIN LATERAL (
      SELECT count(*) AS total, count(*) FILTER (WHERE md.confirmado_em IS NOT NULL) AS ok
      FROM public.mensagem_destinatarios md
      JOIN public.mensagens ms ON ms.id = md.mensagem_id
      JOIN public.perfis dest ON dest.id = md.destinatario_id
      WHERE dest.unidade_id = u.id
        AND ms.exigir_confirmacao = true
        AND ms.created_at > now() - interval '7 days'
    ) t ON t.total > 0
    WHERE u.municipio_id = v_mun.id
      AND (t.ok::numeric / t.total) < 0.30

    UNION ALL

    SELECT jsonb_build_object(
      'tipo', 'cadastro_pendente',
      'severidade', 'media',
      'titulo', p.nome_completo || ' está esperando aprovação',
      'detalhe', 'Cadastro pendente há mais de 48 horas.'
    )
    FROM public.perfis p
    WHERE p.municipio_id = v_mun.id
      AND p.status = 'pendente'
      AND p.created_at < now() - interval '48 hours'
    LIMIT 20
  ) z;

  RETURN jsonb_build_object(
    'municipio', v_mun.nome,
    'uf', v_mun.uf,
    'atualizado_em', now(),
    'kpis', jsonb_build_object(
      'ativos', v_ativos,
      'novos_28d', v_novos,
      'pendentes', v_pendentes,
      'confirmacao_total', v_conf_total,
      'confirmacao_ok', v_conf_ok,
      'confirmacao_pct', CASE WHEN v_conf_total = 0 THEN NULL
                              ELSE round((v_conf_ok::numeric / v_conf_total) * 100) END,
      'mensagens_30d', v_msgs
    ),
    'solicitacoes', v_solic,
    'secretarias', v_secretarias,
    'alertas', v_alertas
  );
END;
$$;

-- Perfil do usuario logado (cargo + escopo) para decidir a navegacao
CREATE OR REPLACE FUNCTION public.painel_meu_contexto()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', p.id,
    'status', p.status,
    'cargo', coalesce(n.nome, ''),
    'secretaria_id', p.secretaria_id,
    'municipio_id', p.municipio_id,
    'is_prefeito', coalesce(n.nome, '') ILIKE '%prefeito%',
    'is_secretario', coalesce(n.nome, '') ILIKE '%secret%'
  )
  FROM public.perfis p
  LEFT JOIN public.niveis n ON n.id = p.nivel_id
  WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.painel_solicitacoes_stats(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.painel_is_prefeito(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.painel_solicitacoes_stats(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.painel_secretaria(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.painel_prefeito() TO authenticated;
GRANT EXECUTE ON FUNCTION public.painel_meu_contexto() TO authenticated;