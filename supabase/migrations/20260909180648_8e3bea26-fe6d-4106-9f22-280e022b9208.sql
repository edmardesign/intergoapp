REVOKE ALL ON FUNCTION public.garantir_hierarquia_secretaria(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.garantir_hierarquia_secretaria(uuid) TO service_role;

ALTER FUNCTION public.get_destinos_hierarquicos() SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.get_destinos_hierarquicos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_destinos_hierarquicos() TO authenticated, service_role;

ALTER FUNCTION public.enviar_mensagem_hierarquica(text,jsonb,boolean,boolean,uuid[],uuid[]) SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.enviar_mensagem_hierarquica(text,jsonb,boolean,boolean,uuid[],uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enviar_mensagem_hierarquica(text,jsonb,boolean,boolean,uuid[],uuid[]) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.trg_perfis_entregar_mensagens_cargo() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trg_perfis_entregar_mensagens_cargo() TO service_role;