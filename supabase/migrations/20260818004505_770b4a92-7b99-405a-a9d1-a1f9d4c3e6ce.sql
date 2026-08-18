DO $$
DECLARE
    sec_id UUID;
    muni_id UUID;
    new_sec_id UUID;
    new_dir_id UUID;
    new_vdir_id UUID;
    new_prof_id UUID;
    new_serv_id UUID;
BEGIN
    FOR sec_id IN SELECT id FROM public.secretarias WHERE nome = 'Educação' LOOP
        SELECT municipio_id INTO muni_id FROM public.secretarias WHERE id = sec_id;

        -- 1. Criar os novos cargos ou atualizar os existentes para MAIÚSCULAS
        -- Garantimos que existam os 5 cargos padrão
        
        -- SECRETÁRIO(A)
        INSERT INTO public.niveis (nome, secretaria_id, municipio_id, ordem, tem_unidade)
        VALUES ('SECRETÁRIO(A)', sec_id, muni_id, 1, false)
        ON CONFLICT DO NOTHING;
        SELECT id INTO new_sec_id FROM public.niveis WHERE secretaria_id = sec_id AND nome = 'SECRETÁRIO(A)';

        -- DIRETOR(A)
        INSERT INTO public.niveis (nome, secretaria_id, municipio_id, ordem, tem_unidade)
        VALUES ('DIRETOR(A)', sec_id, muni_id, 2, true)
        ON CONFLICT DO NOTHING;
        SELECT id INTO new_dir_id FROM public.niveis WHERE secretaria_id = sec_id AND nome = 'DIRETOR(A)';

        -- VICE-DIRETOR(A)
        INSERT INTO public.niveis (nome, secretaria_id, municipio_id, ordem, tem_unidade)
        VALUES ('VICE-DIRETOR(A)', sec_id, muni_id, 3, true)
        ON CONFLICT DO NOTHING;
        SELECT id INTO new_vdir_id FROM public.niveis WHERE secretaria_id = sec_id AND nome = 'VICE-DIRETOR(A)';

        -- PROFESSOR(A)
        INSERT INTO public.niveis (nome, secretaria_id, municipio_id, ordem, tem_unidade)
        VALUES ('PROFESSOR(A)', sec_id, muni_id, 4, true)
        ON CONFLICT DO NOTHING;
        SELECT id INTO new_prof_id FROM public.niveis WHERE secretaria_id = sec_id AND nome = 'PROFESSOR(A)';

        -- SERVIÇOS GERAIS
        INSERT INTO public.niveis (nome, secretaria_id, municipio_id, ordem, tem_unidade)
        VALUES ('SERVIÇOS GERAIS', sec_id, muni_id, 5, true)
        ON CONFLICT DO NOTHING;
        SELECT id INTO new_serv_id FROM public.niveis WHERE secretaria_id = sec_id AND nome = 'SERVIÇOS GERAIS';

        -- 2. Migrar perfis existentes para os novos IDs padrão
        
        -- Migrar Secretários e Adjuntos -> SECRETÁRIO(A)
        UPDATE public.perfis SET nivel_id = new_sec_id 
        WHERE nivel_id IN (SELECT id FROM public.niveis WHERE secretaria_id = sec_id AND nome ILIKE '%Secretario%')
        AND nivel_id != new_sec_id;

        -- Migrar Diretores -> DIRETOR(A)
        UPDATE public.perfis SET nivel_id = new_dir_id 
        WHERE nivel_id IN (SELECT id FROM public.niveis WHERE secretaria_id = sec_id AND nome ILIKE '%Diretor%')
        AND nivel_id != new_dir_id AND nivel_id != new_vdir_id;

        -- Migrar Coordenadores e Servidores -> SERVIÇOS GERAIS (ou o que sobrou)
        UPDATE public.perfis SET nivel_id = new_serv_id 
        WHERE nivel_id IN (SELECT id FROM public.niveis WHERE secretaria_id = sec_id AND nome NOT IN ('SECRETÁRIO(A)', 'DIRETOR(A)', 'VICE-DIRETOR(A)', 'PROFESSOR(A)', 'SERVIÇOS GERAIS'));

        -- 3. Deletar os cargos antigos que não estão no set final de 5 cargos
        DELETE FROM public.niveis 
        WHERE secretaria_id = sec_id 
        AND nome NOT IN ('SECRETÁRIO(A)', 'DIRETOR(A)', 'VICE-DIRETOR(A)', 'PROFESSOR(A)', 'SERVIÇOS GERAIS');
        
    END LOOP;
END $$;