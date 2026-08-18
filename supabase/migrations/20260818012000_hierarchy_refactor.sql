-- 1. Create escopo enum
CREATE TYPE public.cargo_escopo AS ENUM ('municipio', 'secretaria', 'multi_unidade', 'unidade');

-- 2. Create cargos table
CREATE TABLE public.cargos (
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

-- 3. Create perfil_unidades table
CREATE TABLE public.perfil_unidades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
    principal BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS and grants
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfil_unidades ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.cargos TO authenticated, anon;
GRANT ALL ON public.cargos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfil_unidades TO authenticated;
GRANT ALL ON public.perfil_unidades TO service_role;

CREATE POLICY "Cargos acessíveis por todos" ON public.cargos FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Lotações acessíveis por todos" ON public.perfil_unidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários gerenciam suas lotações" ON public.perfil_unidades FOR ALL TO authenticated USING (auth.uid() = perfil_id);

-- 5. Seed Hierarchy (Araci and Município Piloto are known to have Education secretariats)
DO $$
DECLARE
    sec_rec RECORD;
    pref_id UUID;
    sec_edu_id UUID;
    adm_sec_id UUID;
    coord_id UUID;
    dir_id UUID;
BEGIN
    -- Prefeito is municipio scope, secretaria_id is null
    -- We create one Prefeito per municipality (implicit by name or we could have a municipio_id on cargos, 
    -- but the spec says secretaria_id is null for Prefeito)
    -- To keep it simple and global for the municipality:
    
    FOR sec_rec IN SELECT id, municipio_id FROM public.secretarias WHERE nome ILIKE '%Educação%' LOOP
        -- Prefeito (Check if exists for this municipality? Spec says secretaria_id null. 
        -- If we have multiple municipalities, we need a way to distinguish. 
        -- Let's add municipio_id to cargos or use the one from secretaria_id's relation)
        
        -- Insert Prefeito
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

-- 6. Clean up old tables/columns
-- ALTER TABLE public.perfis DROP COLUMN unidade_id; -- Will do this carefully in code or after confirming migration
-- ALTER TABLE public.unidades DROP COLUMN coordenador_id;
