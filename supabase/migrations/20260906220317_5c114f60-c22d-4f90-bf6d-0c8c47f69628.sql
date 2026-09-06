ALTER TABLE public.perfis DROP CONSTRAINT perfis_nivel_id_fkey;
ALTER TABLE public.perfis ADD CONSTRAINT perfis_nivel_id_fkey FOREIGN KEY (nivel_id) REFERENCES public.cargos(id) NOT VALID;