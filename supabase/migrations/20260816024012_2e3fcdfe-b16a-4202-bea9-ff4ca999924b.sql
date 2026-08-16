REVOKE ALL ON FUNCTION public.painel_is_prefeito(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.painel_solicitacoes_stats(uuid, uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.painel_secretaria(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.painel_prefeito() FROM public, anon;
REVOKE ALL ON FUNCTION public.painel_meu_contexto() FROM public, anon;
REVOKE ALL ON FUNCTION public.perfis_publicos_min() FROM anon;

GRANT EXECUTE ON FUNCTION public.painel_is_prefeito(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.painel_solicitacoes_stats(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.painel_secretaria(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.painel_prefeito() TO authenticated;
GRANT EXECUTE ON FUNCTION public.painel_meu_contexto() TO authenticated;
GRANT EXECUTE ON FUNCTION public.perfis_publicos_min() TO authenticated;