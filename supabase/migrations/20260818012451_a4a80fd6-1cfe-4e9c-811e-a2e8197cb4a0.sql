-- 1. Enum de Escopo
DO $$ BEGIN
    CREATE TYPE public.cargo_escopo AS ENUM ('municipio', 'secretaria', 'multi_unidade', 'unidade');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de Cargos (Árvore)
CREATE TABLE IF NOT EXISTS public.cargos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secretaria_id UUID REFERENCES public.secretarias(id),
    nome TEXT NOT NULL,
    cargo_superior_id UUID REFERENCES public.cargos(id),
    escopo public.cargo_escopo NOT NULL,
    delegado_do_superior BOOLEAN DEFAULT FALSE,
    pode_enviar_descendente BOOLEAN DEFAULT TRUE,
    ordem_exibicao INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Lotação (perfil_unidades)
CREATE TABLE IF NOT EXISTS public.perfil_unidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
    principal BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- 4. Limpeza de campos obsoletos
DO $$ 
BEGIN
    ALTER TABLE public.perfis DROP COLUMN IF EXISTS unidade_id;
    ALTER TABLE public.unidades DROP COLUMN IF EXISTS coordenador_id;
EXCEPTION
    WHEN others THEN null;
END $$;

-- 5. Segurança e RLS
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_unidades ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.cargos TO authenticated, anon;
GRANT ALL ON public.cargos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfil_unidades TO authenticated;
GRANT ALL ON public.perfil_unidades TO service_role;

CREATE POLICY "Cargos leitura pública" ON public.cargos FOR SELECT USING (true);
CREATE POLICY "Lotações leitura autenticada" ON public.perfil_unidades FOR SELECT TO authenticated USING (true);

-- Política específica: Só Secretário edita lotação de Coordenador
CREATE OR REPLACE FUNCTION public.is_secretario(user_id UUID) 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfis p
    JOIN public.cargos c ON p.nivel_id = c.id
    WHERE p.id = user_id AND c.nome = 'Secretário de Educação'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "Secretário gerencia lotação de coordenadores" 
ON public.perfil_unidades 
FOR ALL 
TO authenticated 
USING (
  public.is_secretario(auth.uid()) OR (perfil_id = auth.uid())
);

-- 6. Seed dos 8 Cargos da Educação
DO $$
DECLARE
    sec_rec RECORD;
    pref_id UUID;
    sec_edu_id UUID;
    adm_sec_id UUID;
    coord_id UUID;
    dir_id UUID;
BEGIN
    FOR sec_rec IN SELECT id, municipio_id FROM public.secretarias WHERE nome ILIKE '%Educação%' LOOP
        -- Prefeito
        INSERT INTO public.cargos (nome, escopo, pode_enviar_descendente, ordem_exibicao)
        VALUES ('Prefeito', 'municipio', true, 0)
        RETURNING id INTO pref_id;

        -- Secretário de Educação
        INSERT INTO public.cargos (secretaria_id, nome, cargo_superior_id, escopo, pode_enviar_descendente, ordem_exibicao)
        VALUES (sec_rec.id, 'Secretário de Educação', pref_id, 'secretaria', true, 1)
        RETURNING id INTO sec_edu_id;

        -- Administrativo da Secretaria
        INSERT INTO public.cargos (secretaria_id, nome, cargo_superior_id, escopo, pode_enviar_descendente, ordem_exibicao)
        VALUES (sec_rec.id, 'Administrativo da Secretaria', sec_edu_id, 'secretaria', false, 2)
        RETURNING id INTO adm_sec_id;

        -- Coordenador
        INSERT INTO public.cargos (secretaria_id, nome, cargo_superior_id, escopo, pode_enviar_descendente, ordem_exibicao)
        VALUES (sec_rec.id, 'Coordenador', sec_edu_id, 'multi_unidade', true, 3)
        RETURNING id INTO coord_id;

        -- Diretor
        INSERT INTO public.cargos (secretaria_id, nome, cargo_superior_id, escopo, pode_enviar_descendente, ordem_exibicao)
        VALUES (sec_rec.id, 'Diretor', coord_id, 'unidade', true, 4)
        RETURNING id INTO dir_id;

        -- Vice-Diretor
        INSERT INTO public.cargos (secretaria_id, nome, cargo_superior_id, escopo, delegado_do_superior, pode_enviar_descendente, ordem_exibicao)
        VALUES (sec_rec.id, 'Vice-Diretor', dir_id, 'unidade', true, true, 5);

        -- Administrativo da Escola
        INSERT INTO public.cargos (secretaria_id, nome, cargo_superior_id, escopo, pode_enviar_descendente, ordem_exibicao)
        VALUES (sec_rec.id, 'Administrativo da Escola', dir_id, 'unidade', false, 6);

        -- Professor
        INSERT INTO public.cargos (secretaria_id, nome, cargo_superior_id, escopo, pode_enviar_descendente, ordem_exibicao)
        VALUES (sec_rec.id, 'Professor', dir_id, 'unidade', false, 7);

        -- Serviços Gerais
        INSERT INTO public.cargos (secretaria_id, nome, cargo_superior_id, escopo, pode_enviar_descendente, ordem_exibicao)
        VALUES (sec_rec.id, 'Serviços Gerais', dir_id, 'unidade', false, 8);
    END LOOP;
END $$;

-- 7. RLS Avançado para Perfis (Recursivo)
CREATE OR REPLACE FUNCTION public.get_subarvore(root_id UUID)
RETURNS TABLE (profile_id UUID) AS $$
WITH RECURSIVE subarvore AS (
    SELECT id FROM public.perfis WHERE superior_id = root_id
    UNION
    SELECT p.id FROM public.perfis p
    INNER JOIN subarvore s ON p.superior_id = s.id
)
SELECT id FROM subarvore;
$$ LANGUAGE sql SECURITY DEFINER;

-- Re-enable RLS on profiles with new policies
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Perfis visibilidade hierárquica" ON public.perfis;
    DROP POLICY IF EXISTS "Alterar status apenas subordinados diretos" ON public.perfis;
EXCEPTION
    WHEN others THEN null;
END $$;

CREATE POLICY "Perfis visibilidade hierárquica" ON public.perfis
FOR SELECT TO authenticated
USING (
  id = auth.uid() OR 
  superior_id = auth.uid() OR 
  id IN (SELECT public.get_subarvore(auth.uid()))
);

CREATE POLICY "Alterar status apenas subordinados diretos" ON public.perfis
FOR UPDATE TO authenticated
USING (superior_id = auth.uid())
WITH CHECK (superior_id = auth.uid());
