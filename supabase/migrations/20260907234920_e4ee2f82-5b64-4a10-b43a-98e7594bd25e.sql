CREATE OR REPLACE FUNCTION public.trg_perfis_adotar_demos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.nivel_id IS NULL OR NEW.status <> 'ativo' THEN
    RETURN NEW;
  END IF;

  UPDATE public.perfis d
     SET superior_id = NEW.id,
         updated_at  = now()
   WHERE d.id <> NEW.id
     AND d.status = 'ativo'
     AND d.municipio_id = NEW.municipio_id
     AND d.nivel_id IN (
           SELECT c.id FROM public.cargos c WHERE c.cargo_superior_id = NEW.nivel_id
         )
     AND (NEW.secretaria_id IS NULL OR d.secretaria_id = NEW.secretaria_id)
     AND EXISTS (
           SELECT 1 FROM auth.users u
            WHERE u.id = d.id AND u.email LIKE '%.demo@intergo.local'
         );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_perfis_adotar_demos ON public.perfis;
CREATE TRIGGER trg_perfis_adotar_demos
AFTER INSERT ON public.perfis
FOR EACH ROW EXECUTE FUNCTION public.trg_perfis_adotar_demos();