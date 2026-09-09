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
  SELECT
    p.id,
    p.nome_completo,
    p.nivel_id,
    pu.unidade_id,
    p.secretaria_id,
    p.municipio_id
  FROM public.perfis p
  LEFT JOIN LATERAL (
    SELECT perfil_unidades.unidade_id
    FROM public.perfil_unidades
    WHERE perfil_unidades.perfil_id = p.id
    ORDER BY perfil_unidades.principal DESC, perfil_unidades.unidade_id
    LIMIT 1
  ) pu ON true
  WHERE p.status = 'ativo';
$$;
REVOKE ALL ON FUNCTION public.perfis_publicos_min() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.perfis_publicos_min() TO authenticated, service_role;