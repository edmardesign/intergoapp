-- 1. Resolver/criar cargo no cadastro
CREATE OR REPLACE FUNCTION public.resolver_cargo(p_secretaria_id uuid, p_nome text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_municipio uuid;
  v_sup uuid;
  v_escopo cargo_escopo;
  v_nome text := btrim(p_nome);
  v_low text;
BEGIN
  IF p_secretaria_id IS NULL OR v_nome = '' THEN RETURN NULL; END IF;
  v_low := lower(v_nome);

  SELECT id INTO v_id FROM public.cargos
   WHERE secretaria_id = p_secretaria_id AND lower(nome) = v_low LIMIT 1;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;

  SELECT municipio_id INTO v_municipio FROM public.secretarias WHERE id = p_secretaria_id;

  IF v_low LIKE '%secret%' THEN
    v_escopo := 'secretaria';
    SELECT id INTO v_sup FROM public.cargos
     WHERE municipio_id = v_municipio AND escopo = 'municipio' LIMIT 1;
  ELSIF v_low LIKE 'diretor%' OR v_low LIKE 'vice-diretor%' OR v_low LIKE 'coorden%' OR v_low LIKE 'chefe%' THEN
    v_escopo := 'unidade';
    SELECT id INTO v_sup FROM public.cargos
     WHERE secretaria_id = p_secretaria_id AND escopo = 'secretaria' LIMIT 1;
  ELSE
    v_escopo := 'unidade';
    SELECT id INTO v_sup FROM public.cargos
     WHERE secretaria_id = p_secretaria_id AND lower(nome) LIKE 'diretor%' LIMIT 1;
    IF v_sup IS NULL THEN
      SELECT id INTO v_sup FROM public.cargos
       WHERE secretaria_id = p_secretaria_id AND escopo = 'secretaria' LIMIT 1;
    END IF;
  END IF;

  INSERT INTO public.cargos (secretaria_id, nome, cargo_superior_id, escopo,
                             pode_enviar_descendente, municipio_id)
  VALUES (p_secretaria_id, v_nome, v_sup, v_escopo,
          (v_escopo <> 'unidade' OR v_low LIKE 'diretor%' OR v_low LIKE 'coorden%'), NULL)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolver_cargo(uuid, text) TO authenticated;

-- 2. Trigger com fallback por NOME do cargo superior no mesmo município
CREATE OR REPLACE FUNCTION public.trg_perfis_backfill_superior()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cargo_sup uuid;
  v_nome_sup text;
BEGIN
  IF NEW.superior_id IS NOT NULL OR NEW.nivel_id IS NULL THEN RETURN NEW; END IF;

  SELECT c.cargo_superior_id INTO v_cargo_sup FROM public.cargos c WHERE c.id = NEW.nivel_id;
  IF v_cargo_sup IS NULL THEN RETURN NEW; END IF;

  SELECT sp.id INTO NEW.superior_id
    FROM public.perfis sp
   WHERE sp.nivel_id = v_cargo_sup
     AND sp.status = 'ativo'
     AND (sp.municipio_id IS NULL OR sp.municipio_id = NEW.municipio_id)
   ORDER BY sp.created_at ASC LIMIT 1;

  IF NEW.superior_id IS NOT NULL THEN RETURN NEW; END IF;

  -- fallback: mesma denominação de cargo no mesmo município
  SELECT nome INTO v_nome_sup FROM public.cargos WHERE id = v_cargo_sup;
  SELECT sp.id INTO NEW.superior_id
    FROM public.perfis sp
    JOIN public.cargos sc ON sc.id = sp.nivel_id
   WHERE lower(sc.nome) = lower(v_nome_sup)
     AND sp.status = 'ativo'
     AND sp.municipio_id = NEW.municipio_id
   ORDER BY sp.created_at ASC LIMIT 1;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_perfis_backfill_superior ON public.perfis;
CREATE TRIGGER trg_perfis_backfill_superior
BEFORE INSERT ON public.perfis
FOR EACH ROW EXECUTE FUNCTION public.trg_perfis_backfill_superior();

-- 3. Backfill dos perfis existentes sem superior
UPDATE public.perfis p
   SET superior_id = sub.sup
  FROM (
    SELECT p2.id,
           COALESCE(
             (SELECT sp.id FROM public.perfis sp
               WHERE sp.nivel_id = c.cargo_superior_id AND sp.status='ativo'
                 AND (sp.municipio_id IS NULL OR sp.municipio_id = p2.municipio_id)
               ORDER BY sp.created_at LIMIT 1),
             (SELECT sp.id FROM public.perfis sp
                JOIN public.cargos sc ON sc.id = sp.nivel_id
                JOIN public.cargos csup ON csup.id = c.cargo_superior_id
               WHERE lower(sc.nome) = lower(csup.nome) AND sp.status='ativo'
                 AND sp.municipio_id = p2.municipio_id
               ORDER BY sp.created_at LIMIT 1)
           ) AS sup
      FROM public.perfis p2
      JOIN public.cargos c ON c.id = p2.nivel_id
     WHERE p2.superior_id IS NULL AND c.cargo_superior_id IS NOT NULL
  ) sub
 WHERE p.id = sub.id AND sub.sup IS NOT NULL AND sub.sup <> p.id;