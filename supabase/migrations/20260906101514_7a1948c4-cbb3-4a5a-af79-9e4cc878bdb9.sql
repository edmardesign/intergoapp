DROP POLICY IF EXISTS "Usuários gerenciam suas lotações" ON public.perfil_unidades;
REVOKE INSERT, UPDATE, DELETE ON public.perfil_unidades FROM authenticated;
DROP POLICY IF EXISTS "perfil_unidades_write_by_superior" ON public.perfil_unidades;
CREATE POLICY "perfil_unidades_write_by_superior" ON public.perfil_unidades FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.perfis p WHERE p.id = perfil_unidades.perfil_id AND p.superior_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.perfis p WHERE p.id = perfil_unidades.perfil_id AND p.superior_id = auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfil_unidades TO authenticated;