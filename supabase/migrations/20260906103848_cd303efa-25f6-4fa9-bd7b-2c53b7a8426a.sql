CREATE OR REPLACE FUNCTION public.criar_lotacao_inicial(
  p_perfil_id uuid,
  p_unidade_id uuid,
  p_principal boolean DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF auth.uid() <> p_perfil_id THEN
    RAISE EXCEPTION 'Só é possível registrar a lotação do próprio usuário';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.perfis WHERE id = p_perfil_id) THEN
    RAISE EXCEPTION 'Perfil inexistente';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.unidades WHERE id = p_unidade_id) THEN
    RAISE EXCEPTION 'Unidade inexistente';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.perfil_unidades
    WHERE perfil_id = p_perfil_id AND unidade_id = p_unidade_id
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.perfil_unidades (perfil_id, unidade_id, principal)
  VALUES (p_perfil_id, p_unidade_id, COALESCE(p_principal, false));
END;
$$;

REVOKE ALL ON FUNCTION public.criar_lotacao_inicial(uuid, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.criar_lotacao_inicial(uuid, uuid, boolean) TO authenticated;