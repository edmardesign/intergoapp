-- ESTADOS
CREATE TABLE public.estados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  sigla text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.estados TO anon, authenticated;
GRANT ALL ON public.estados TO service_role;
ALTER TABLE public.estados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Estados são públicos" ON public.estados FOR SELECT TO anon, authenticated USING (true);

-- MUNICIPIOS
CREATE TABLE public.municipios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estado_id uuid NOT NULL REFERENCES public.estados(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_municipios_estado ON public.municipios(estado_id);
GRANT SELECT ON public.municipios TO anon, authenticated;
GRANT ALL ON public.municipios TO service_role;
ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Municipios são públicos" ON public.municipios FOR SELECT TO anon, authenticated USING (true);

-- SECRETARIAS
CREATE TABLE public.secretarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id uuid NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  nome text NOT NULL,
  icone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_secretarias_municipio ON public.secretarias(municipio_id);
GRANT SELECT ON public.secretarias TO anon, authenticated;
GRANT ALL ON public.secretarias TO service_role;
ALTER TABLE public.secretarias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Secretarias são públicas" ON public.secretarias FOR SELECT TO anon, authenticated USING (true);

-- NIVEIS
CREATE TABLE public.niveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id uuid NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  secretaria_id uuid REFERENCES public.secretarias(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  tem_unidade boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_niveis_municipio ON public.niveis(municipio_id);
CREATE INDEX idx_niveis_secretaria ON public.niveis(secretaria_id);
GRANT SELECT ON public.niveis TO anon, authenticated;
GRANT ALL ON public.niveis TO service_role;
ALTER TABLE public.niveis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Niveis são públicos" ON public.niveis FOR SELECT TO anon, authenticated USING (true);

-- UNIDADES
CREATE TABLE public.unidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_id uuid NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
  secretaria_id uuid NOT NULL REFERENCES public.secretarias(id) ON DELETE CASCADE,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_unidades_secretaria ON public.unidades(secretaria_id);
GRANT SELECT ON public.unidades TO anon, authenticated;
GRANT ALL ON public.unidades TO service_role;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Unidades são públicas" ON public.unidades FOR SELECT TO anon, authenticated USING (true);

-- VIEW PUBLICA MINIMA DE PERFIS ATIVOS
CREATE VIEW public.perfis_publicos_min
WITH (security_invoker = off) AS
SELECT id, nome_completo, nivel_id, unidade_id, secretaria_id, municipio_id
FROM public.perfis
WHERE status = 'ativo';
GRANT SELECT ON public.perfis_publicos_min TO anon, authenticated;

-- SEED DOS 27 ESTADOS
INSERT INTO public.estados (nome, sigla) VALUES
('Acre','AC'),('Alagoas','AL'),('Amapá','AP'),('Amazonas','AM'),('Bahia','BA'),
('Ceará','CE'),('Distrito Federal','DF'),('Espírito Santo','ES'),('Goiás','GO'),
('Maranhão','MA'),('Mato Grosso','MT'),('Mato Grosso do Sul','MS'),('Minas Gerais','MG'),
('Pará','PA'),('Paraíba','PB'),('Paraná','PR'),('Pernambuco','PE'),('Piauí','PI'),
('Rio de Janeiro','RJ'),('Rio Grande do Norte','RN'),('Rio Grande do Sul','RS'),
('Rondônia','RO'),('Roraima','RR'),('Santa Catarina','SC'),('São Paulo','SP'),
('Sergipe','SE'),('Tocantins','TO');