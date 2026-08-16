DROP VIEW IF EXISTS public.perfis_publicos_min;

CREATE OR REPLACE FUNCTION public.perfis_publicos_min()
RETURNS TABLE (
  id uuid,
  nome_completo text,
  nivel_id uuid,
  unidade_id uuid,
  secretaria_id uuid,
  municipio_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.nome_completo, p.nivel_id, p.unidade_id, p.secretaria_id, p.municipio_id
  FROM public.perfis p
  WHERE p.status = 'ativo';
$$;

GRANT EXECUTE ON FUNCTION public.perfis_publicos_min() TO anon, authenticated;