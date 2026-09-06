CREATE OR REPLACE FUNCTION public.resolver_secretaria(p_municipio_id uuid, p_nome text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome text := btrim(p_nome);
  v_id uuid;
BEGIN
  IF v_nome IS NULL OR length(v_nome) < 2 THEN
    RAISE EXCEPTION 'Nome de secretaria inválido';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.municipios WHERE id = p_municipio_id) THEN
    RAISE EXCEPTION 'Município inexistente';
  END IF;

  SELECT id INTO v_id
  FROM public.secretarias
  WHERE municipio_id = p_municipio_id AND lower(nome) = lower(v_nome)
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.secretarias (municipio_id, nome)
  VALUES (p_municipio_id, v_nome)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.resolver_secretaria(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolver_secretaria(uuid, text) TO anon, authenticated;