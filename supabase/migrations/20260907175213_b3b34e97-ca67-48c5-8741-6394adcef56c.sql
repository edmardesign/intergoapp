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

  IF v_cargo_sup IS NOT NULL THEN
    SELECT sp.id INTO NEW.superior_id
      FROM public.perfis sp
     WHERE sp.nivel_id = v_cargo_sup AND sp.status = 'ativo'
       AND (sp.municipio_id IS NULL OR sp.municipio_id = NEW.municipio_id)
     ORDER BY sp.created_at ASC LIMIT 1;

    IF NEW.superior_id IS NULL THEN
      SELECT nome INTO v_nome_sup FROM public.cargos WHERE id = v_cargo_sup;
      SELECT sp.id INTO NEW.superior_id
        FROM public.perfis sp
        JOIN public.cargos sc ON sc.id = sp.nivel_id
       WHERE lower(sc.nome) = lower(v_nome_sup) AND sp.status = 'ativo'
         AND sp.municipio_id = NEW.municipio_id
       ORDER BY sp.created_at ASC LIMIT 1;
    END IF;
  END IF;

  -- último recurso: Prefeito do município
  IF NEW.superior_id IS NULL THEN
    SELECT sp.id INTO NEW.superior_id
      FROM public.perfis sp
      JOIN public.cargos sc ON sc.id = sp.nivel_id
     WHERE sc.escopo = 'municipio' AND sp.status = 'ativo'
       AND sp.municipio_id = NEW.municipio_id AND sp.id <> NEW.id
     ORDER BY sp.created_at ASC LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

UPDATE public.perfis p
   SET superior_id = (
        SELECT sp.id FROM public.perfis sp
          JOIN public.cargos sc ON sc.id = sp.nivel_id
         WHERE sc.escopo = 'municipio' AND sp.status='ativo'
           AND sp.municipio_id = p.municipio_id AND sp.id <> p.id
         ORDER BY sp.created_at LIMIT 1)
 WHERE p.superior_id IS NULL AND p.nivel_id IS NOT NULL;