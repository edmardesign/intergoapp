CREATE TABLE public.mensagem_cargos (
  mensagem_id uuid NOT NULL REFERENCES public.mensagens(id) ON DELETE CASCADE,
  cargo_id uuid NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  municipio_id uuid NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  secretaria_id uuid REFERENCES public.secretarias(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (mensagem_id, cargo_id, municipio_id)
);
GRANT SELECT, INSERT ON public.mensagem_cargos TO authenticated;
GRANT ALL ON public.mensagem_cargos TO service_role;
ALTER TABLE public.mensagem_cargos ENABLE ROW LEVEL SECURITY;
CREATE POLICY mensagem_cargos_select_remetente
ON public.mensagem_cargos FOR SELECT TO authenticated
USING (public.msg_e_meu_envio(mensagem_id));
CREATE POLICY mensagem_cargos_insert_remetente
ON public.mensagem_cargos FOR INSERT TO authenticated
WITH CHECK (public.msg_e_meu_envio(mensagem_id));

CREATE INDEX mensagem_cargos_destino_idx
ON public.mensagem_cargos (cargo_id, municipio_id, secretaria_id);

CREATE OR REPLACE FUNCTION public.garantir_hierarquia_secretaria(p_secretaria_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_municipio uuid;
  v_area text;
  v_prefeito uuid;
  v_secretario uuid;
  v_gestor uuid;
  v_chefia uuid;
  v_nome_secretario text;
  v_nome_gestor text;
  v_nome_chefia text;
  v_operacionais text[];
  v_nome text;
  v_operacional uuid;
BEGIN
  SELECT s.municipio_id,
         CASE
           WHEN lower(s.nome) LIKE '%saúde%' OR lower(s.nome) LIKE '%saude%' THEN 'saude'
           WHEN lower(s.nome) LIKE '%educa%' THEN 'educacao'
           WHEN lower(s.nome) LIKE '%assist%' THEN 'assistencia'
           WHEN lower(s.nome) LIKE '%finan%' OR lower(s.nome) LIKE '%fazenda%' THEN 'financas'
           WHEN lower(s.nome) LIKE '%obra%' OR lower(s.nome) LIKE '%infra%' THEN 'obras'
           WHEN lower(s.nome) LIKE '%admin%' THEN 'administracao'
           WHEN lower(s.nome) LIKE '%ambient%' THEN 'ambiente'
           WHEN lower(s.nome) LIKE '%cultura%' OR lower(s.nome) LIKE '%esporte%' OR lower(s.nome) LIKE '%turismo%' THEN 'cultura'
           WHEN lower(s.nome) LIKE '%agric%' THEN 'agricultura'
           ELSE 'geral'
         END
    INTO v_municipio, v_area
  FROM public.secretarias s WHERE s.id = p_secretaria_id;
  IF v_municipio IS NULL THEN RAISE EXCEPTION 'Secretaria inexistente'; END IF;

  SELECT id INTO v_prefeito FROM public.cargos
   WHERE escopo = 'municipio' AND municipio_id = v_municipio
     AND lower(nome) LIKE '%prefeito%' ORDER BY created_at LIMIT 1;
  IF v_prefeito IS NULL THEN
    INSERT INTO public.cargos (nome, escopo, municipio_id, pode_enviar_descendente, ordem_exibicao)
    VALUES ('Prefeito', 'municipio', v_municipio, true, 1) RETURNING id INTO v_prefeito;
  END IF;

  v_nome_secretario := CASE v_area
    WHEN 'saude' THEN 'Secretário de Saúde' WHEN 'educacao' THEN 'Secretário de Educação'
    WHEN 'assistencia' THEN 'Secretário de Assistência Social' WHEN 'financas' THEN 'Secretário de Finanças'
    WHEN 'obras' THEN 'Secretário de Obras e Infraestrutura' WHEN 'administracao' THEN 'Secretário de Administração'
    WHEN 'ambiente' THEN 'Secretário de Meio Ambiente' WHEN 'cultura' THEN 'Secretário de Cultura e Esporte'
    WHEN 'agricultura' THEN 'Secretário de Agricultura' ELSE 'Secretário' END;
  SELECT id INTO v_secretario FROM public.cargos WHERE secretaria_id=p_secretaria_id AND lower(nome)=lower(v_nome_secretario) LIMIT 1;
  IF v_secretario IS NULL THEN
    INSERT INTO public.cargos (secretaria_id,nome,cargo_superior_id,escopo,pode_enviar_descendente,ordem_exibicao)
    VALUES (p_secretaria_id,v_nome_secretario,v_prefeito,'secretaria',true,10) RETURNING id INTO v_secretario;
  ELSE
    UPDATE public.cargos SET cargo_superior_id=v_prefeito, escopo='secretaria', pode_enviar_descendente=true WHERE id=v_secretario;
  END IF;

  v_nome_gestor := CASE v_area
    WHEN 'saude' THEN 'Diretor de Unidade de Saúde' WHEN 'educacao' THEN 'Coordenador Pedagógico'
    WHEN 'assistencia' THEN 'Coordenador de Proteção Social' WHEN 'financas' THEN 'Diretor Financeiro'
    WHEN 'obras' THEN 'Diretor de Obras' WHEN 'administracao' THEN 'Diretor Administrativo'
    WHEN 'ambiente' THEN 'Coordenador Ambiental' WHEN 'cultura' THEN 'Coordenador de Cultura e Esporte'
    WHEN 'agricultura' THEN 'Diretor de Desenvolvimento Rural' ELSE 'Diretor' END;
  SELECT id INTO v_gestor FROM public.cargos WHERE secretaria_id=p_secretaria_id AND lower(nome)=lower(v_nome_gestor) LIMIT 1;
  IF v_gestor IS NULL THEN
    INSERT INTO public.cargos (secretaria_id,nome,cargo_superior_id,escopo,pode_enviar_descendente,ordem_exibicao)
    VALUES (p_secretaria_id,v_nome_gestor,v_secretario,'multi_unidade',true,20) RETURNING id INTO v_gestor;
  ELSE
    UPDATE public.cargos SET cargo_superior_id=v_secretario, pode_enviar_descendente=true WHERE id=v_gestor;
  END IF;

  v_nome_chefia := CASE v_area
    WHEN 'saude' THEN 'Coordenador de Equipe de Saúde' WHEN 'educacao' THEN 'Diretor Escolar'
    WHEN 'assistencia' THEN 'Coordenador de CRAS/CREAS' WHEN 'financas' THEN 'Chefe de Arrecadação e Tesouraria'
    WHEN 'obras' THEN 'Encarregado de Obras' WHEN 'administracao' THEN 'Chefe de Setor'
    WHEN 'ambiente' THEN 'Chefe de Fiscalização Ambiental' WHEN 'cultura' THEN 'Coordenador de Núcleo Cultural e Esportivo'
    WHEN 'agricultura' THEN 'Coordenador de Campo' ELSE 'Chefe de Setor' END;
  SELECT id INTO v_chefia FROM public.cargos WHERE secretaria_id=p_secretaria_id AND lower(nome)=lower(v_nome_chefia) LIMIT 1;
  IF v_chefia IS NULL THEN
    INSERT INTO public.cargos (secretaria_id,nome,cargo_superior_id,escopo,pode_enviar_descendente,ordem_exibicao)
    VALUES (p_secretaria_id,v_nome_chefia,v_gestor,'unidade',true,30) RETURNING id INTO v_chefia;
  ELSE
    UPDATE public.cargos SET cargo_superior_id=v_gestor, pode_enviar_descendente=true WHERE id=v_chefia;
  END IF;

  v_operacionais := CASE v_area
    WHEN 'saude' THEN ARRAY['Médico','Enfermeiro','Técnico de Enfermagem','Agente Comunitário de Saúde','Recepcionista']
    WHEN 'educacao' THEN ARRAY['Professor','Vice-Diretor','Secretário Escolar','Auxiliar de Serviços Gerais']
    WHEN 'assistencia' THEN ARRAY['Assistente Social','Psicólogo','Educador Social','Orientador Social']
    WHEN 'financas' THEN ARRAY['Contador','Tesoureiro','Fiscal de Tributos','Auxiliar Administrativo']
    WHEN 'obras' THEN ARRAY['Engenheiro Civil','Arquiteto','Fiscal de Obras','Operador de Máquinas']
    WHEN 'administracao' THEN ARRAY['Chefe de Gabinete','Coordenador de Recursos Humanos','Assistente Administrativo','Almoxarife']
    WHEN 'ambiente' THEN ARRAY['Fiscal Ambiental','Técnico Ambiental','Agente de Educação Ambiental']
    WHEN 'cultura' THEN ARRAY['Professor de Educação Física','Produtor Cultural','Instrutor Cultural','Agente de Esporte e Lazer']
    WHEN 'agricultura' THEN ARRAY['Técnico Agrícola','Veterinário','Agente de Desenvolvimento Rural']
    ELSE ARRAY['Coordenador','Assistente Administrativo','Servidor'] END;

  FOREACH v_nome IN ARRAY v_operacionais LOOP
    SELECT id INTO v_operacional FROM public.cargos WHERE secretaria_id=p_secretaria_id AND lower(nome)=lower(v_nome) LIMIT 1;
    IF v_operacional IS NULL THEN
      INSERT INTO public.cargos (secretaria_id,nome,cargo_superior_id,escopo,pode_enviar_descendente,ordem_exibicao)
      VALUES (p_secretaria_id,v_nome,v_chefia,'unidade',true,40) RETURNING id INTO v_operacional;
    ELSE
      UPDATE public.cargos SET cargo_superior_id=COALESCE(cargo_superior_id,v_chefia), pode_enviar_descendente=true WHERE id=v_operacional;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.cargos WHERE secretaria_id=p_secretaria_id AND cargo_superior_id=v_operacional AND lower(nome)=lower('Apoio de '||v_nome)) THEN
      INSERT INTO public.cargos (secretaria_id,nome,cargo_superior_id,escopo,pode_enviar_descendente,ordem_exibicao)
      VALUES (p_secretaria_id,'Apoio de '||v_nome,v_operacional,'unidade',false,50);
    END IF;
  END LOOP;
END;
$$;
REVOKE ALL ON FUNCTION public.garantir_hierarquia_secretaria(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.garantir_hierarquia_secretaria(uuid) TO authenticated, service_role;

DO $$ DECLARE r record; BEGIN FOR r IN SELECT id FROM public.secretarias LOOP PERFORM public.garantir_hierarquia_secretaria(r.id); END LOOP; END $$;

CREATE OR REPLACE FUNCTION public.resolver_secretaria(p_municipio_id uuid, p_nome text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_nome text:=btrim(p_nome); v_id uuid;
BEGIN
 IF v_nome IS NULL OR length(v_nome)<2 THEN RAISE EXCEPTION 'Nome de secretaria inválido'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.municipios WHERE id=p_municipio_id) THEN RAISE EXCEPTION 'Município inexistente'; END IF;
 SELECT id INTO v_id FROM public.secretarias WHERE municipio_id=p_municipio_id AND lower(nome)=lower(v_nome) LIMIT 1;
 IF v_id IS NULL THEN INSERT INTO public.secretarias(municipio_id,nome) VALUES(p_municipio_id,v_nome) RETURNING id INTO v_id; END IF;
 PERFORM public.garantir_hierarquia_secretaria(v_id);
 RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.resolver_cargo(p_secretaria_id uuid,p_nome text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_parent uuid; v_low text:=lower(btrim(p_nome)); v_escopo cargo_escopo:='unidade';
BEGIN
 IF p_secretaria_id IS NULL OR v_low='' THEN RETURN NULL; END IF;
 PERFORM public.garantir_hierarquia_secretaria(p_secretaria_id);
 SELECT id INTO v_id FROM public.cargos WHERE secretaria_id=p_secretaria_id AND lower(nome)=v_low LIMIT 1;
 IF v_id IS NOT NULL THEN RETURN v_id; END IF;
 IF v_low LIKE '%secretári%' OR v_low LIKE '%secretari%' THEN
   SELECT cargo_superior_id INTO v_parent FROM public.cargos WHERE secretaria_id=p_secretaria_id AND escopo='secretaria' ORDER BY ordem_exibicao LIMIT 1; v_escopo:='secretaria';
 ELSIF v_low LIKE '%diretor%' OR v_low LIKE '%coorden%' OR v_low LIKE '%chefe%' OR v_low LIKE '%encarregado%' THEN
   SELECT id INTO v_parent FROM public.cargos WHERE secretaria_id=p_secretaria_id AND escopo='secretaria' ORDER BY ordem_exibicao LIMIT 1; v_escopo:='multi_unidade';
 ELSE
   SELECT id INTO v_parent FROM public.cargos WHERE secretaria_id=p_secretaria_id AND escopo IN ('multi_unidade','unidade') AND pode_enviar_descendente=true ORDER BY ordem_exibicao DESC LIMIT 1;
 END IF;
 INSERT INTO public.cargos(secretaria_id,nome,cargo_superior_id,escopo,pode_enviar_descendente,ordem_exibicao)
 VALUES(p_secretaria_id,btrim(p_nome),v_parent,v_escopo,true,45) RETURNING id INTO v_id;
 INSERT INTO public.cargos(secretaria_id,nome,cargo_superior_id,escopo,pode_enviar_descendente,ordem_exibicao)
 VALUES(p_secretaria_id,'Apoio de '||btrim(p_nome),v_id,'unidade',false,50);
 RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.get_destinos_hierarquicos()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid:=auth.uid(); v_perfil record; v_cargos jsonb; v_pessoas jsonb;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
 SELECT id,nivel_id,municipio_id,secretaria_id INTO v_perfil FROM public.perfis WHERE id=v_uid AND status='ativo';
 IF v_perfil IS NULL OR v_perfil.nivel_id IS NULL THEN RETURN jsonb_build_object('cargos','[]'::jsonb,'pessoas','[]'::jsonb); END IF;
 WITH RECURSIVE arvore AS (
   SELECT c.id,c.nome,c.cargo_superior_id,c.escopo,1 profundidade FROM public.cargos c WHERE c.cargo_superior_id=v_perfil.nivel_id
   UNION ALL SELECT c.id,c.nome,c.cargo_superior_id,c.escopo,a.profundidade+1 FROM public.cargos c JOIN arvore a ON c.cargo_superior_id=a.id
 ), filtrada AS (
   SELECT a.* FROM arvore a JOIN public.cargos c ON c.id=a.id LEFT JOIN public.secretarias s ON s.id=c.secretaria_id
   WHERE (s.municipio_id=v_perfil.municipio_id OR c.municipio_id=v_perfil.municipio_id)
     AND (v_perfil.secretaria_id IS NULL OR c.secretaria_id=v_perfil.secretaria_id)
 ) SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'nome',nome,'profundidade',profundidade) ORDER BY profundidade,nome),'[]'::jsonb) INTO v_cargos FROM filtrada;
 WITH RECURSIVE ids AS (
   SELECT c.id FROM public.cargos c WHERE c.cargo_superior_id=v_perfil.nivel_id
   UNION ALL SELECT c.id FROM public.cargos c JOIN ids i ON c.cargo_superior_id=i.id
 ) SELECT coalesce(jsonb_agg(jsonb_build_object('id',p.id,'nome_completo',p.nome_completo,'cargo_id',p.nivel_id,'cargo_nome',c.nome) ORDER BY p.nome_completo),'[]'::jsonb)
 INTO v_pessoas FROM public.perfis p JOIN ids i ON i.id=p.nivel_id JOIN public.cargos c ON c.id=p.nivel_id
 WHERE p.status='ativo' AND p.municipio_id=v_perfil.municipio_id AND (v_perfil.secretaria_id IS NULL OR p.secretaria_id=v_perfil.secretaria_id);
 RETURN jsonb_build_object('cargos',v_cargos,'pessoas',v_pessoas);
END; $$;
REVOKE ALL ON FUNCTION public.get_destinos_hierarquicos() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_destinos_hierarquicos() TO authenticated;

CREATE OR REPLACE FUNCTION public.enviar_mensagem_hierarquica(p_tipo text,p_payload jsonb,p_exigir_confirmacao boolean,p_urgente boolean,p_pessoas uuid[] DEFAULT ARRAY[]::uuid[],p_cargos uuid[] DEFAULT ARRAY[]::uuid[])
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid:=auth.uid(); v_perfil record; v_msg uuid; v_cargos uuid[];
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
 SELECT nivel_id,municipio_id,secretaria_id INTO v_perfil FROM public.perfis WHERE id=v_uid AND status='ativo';
 IF v_perfil IS NULL OR v_perfil.nivel_id IS NULL THEN RAISE EXCEPTION 'Perfil sem cargo ativo'; END IF;
 WITH RECURSIVE abaixo AS (
   SELECT id FROM public.cargos WHERE cargo_superior_id=v_perfil.nivel_id
   UNION ALL SELECT c.id FROM public.cargos c JOIN abaixo a ON c.cargo_superior_id=a.id
 ) SELECT coalesce(array_agg(id),ARRAY[]::uuid[]) INTO v_cargos FROM abaixo WHERE p_cargos IS NULL OR cardinality(p_cargos)=0 OR id=ANY(p_cargos);
 IF cardinality(v_cargos)=0 AND cardinality(coalesce(p_pessoas,ARRAY[]::uuid[]))=0 THEN RAISE EXCEPTION 'Selecione ao menos um cargo ou pessoa abaixo de você'; END IF;
 IF EXISTS (SELECT 1 FROM unnest(coalesce(p_pessoas,ARRAY[]::uuid[])) x(id) WHERE NOT EXISTS (SELECT 1 FROM public.get_subarvore_recursiva(v_uid) s WHERE s.id=x.id)) THEN RAISE EXCEPTION 'Destinatário fora da sua hierarquia'; END IF;
 INSERT INTO public.mensagens(remetente_id,tipo,payload,exigir_confirmacao,urgente) VALUES(v_uid,p_tipo::public.mensagem_tipo,coalesce(p_payload,'{}'::jsonb),coalesce(p_exigir_confirmacao,false),coalesce(p_urgente,false)) RETURNING id INTO v_msg;
 INSERT INTO public.mensagem_cargos(mensagem_id,cargo_id,municipio_id,secretaria_id)
 SELECT v_msg,c.id,v_perfil.municipio_id,c.secretaria_id FROM public.cargos c WHERE c.id=ANY(v_cargos)
   AND (v_perfil.secretaria_id IS NULL OR c.secretaria_id=v_perfil.secretaria_id) ON CONFLICT DO NOTHING;
 INSERT INTO public.mensagem_destinatarios(mensagem_id,destinatario_id,entregue_em)
 SELECT v_msg,p.id,now() FROM public.perfis p WHERE p.status='ativo' AND p.municipio_id=v_perfil.municipio_id
   AND (p.id=ANY(coalesce(p_pessoas,ARRAY[]::uuid[])) OR p.nivel_id=ANY(v_cargos))
   AND (v_perfil.secretaria_id IS NULL OR p.secretaria_id=v_perfil.secretaria_id) ON CONFLICT DO NOTHING;
 RETURN v_msg;
END; $$;
REVOKE ALL ON FUNCTION public.enviar_mensagem_hierarquica(text,jsonb,boolean,boolean,uuid[],uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enviar_mensagem_hierarquica(text,jsonb,boolean,boolean,uuid[],uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.trg_perfis_entregar_mensagens_cargo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.status='ativo' AND NEW.nivel_id IS NOT NULL THEN
   INSERT INTO public.mensagem_destinatarios(mensagem_id,destinatario_id,entregue_em)
   SELECT mc.mensagem_id,NEW.id,now() FROM public.mensagem_cargos mc
   WHERE mc.cargo_id=NEW.nivel_id AND mc.municipio_id=NEW.municipio_id
     AND (mc.secretaria_id IS NULL OR mc.secretaria_id=NEW.secretaria_id)
   ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_perfis_entregar_mensagens_cargo ON public.perfis;
CREATE TRIGGER trg_perfis_entregar_mensagens_cargo AFTER INSERT OR UPDATE OF status,nivel_id ON public.perfis FOR EACH ROW EXECUTE FUNCTION public.trg_perfis_entregar_mensagens_cargo();

DROP POLICY IF EXISTS "Envio somente com subordinados" ON public.mensagens;
CREATE POLICY mensagens_insert_proprio ON public.mensagens FOR INSERT TO authenticated WITH CHECK(remetente_id=auth.uid());