REVOKE EXECUTE ON FUNCTION public.perfis_publicos_min() FROM public;
GRANT EXECUTE ON FUNCTION public.perfis_publicos_min() TO authenticated;
GRANT EXECUTE ON FUNCTION public.perfis_publicos_min() TO service_role;
ALTER FUNCTION public.perfis_publicos_min() SET search_path = public;
