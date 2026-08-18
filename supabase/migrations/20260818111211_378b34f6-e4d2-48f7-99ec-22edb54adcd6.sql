-- Segurança para tabelas de referência
GRANT SELECT ON public.estados TO authenticated;
GRANT SELECT ON public.municipios TO authenticated;
GRANT SELECT ON public.secretarias TO authenticated;
GRANT SELECT ON public.unidades TO authenticated;
GRANT SELECT ON public.cargos TO authenticated;

-- RLS para solicitacao_eventos
ALTER TABLE public.solicitacao_eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "solicitacao_eventos_isolation" ON public.solicitacao_eventos;
CREATE POLICY "solicitacao_eventos_isolation" ON public.solicitacao_eventos FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.solicitacoes s
        WHERE s.id = solicitacao_eventos.solicitacao_id
        AND (
            auth.uid() = s.solicitante_id OR 
            auth.uid() = s.responsavel_atual_id OR
            EXISTS (SELECT 1 FROM public.perfis p WHERE p.id = s.solicitante_id AND p.superior_id = auth.uid())
        )
    )
);

-- RLS para perfil_unidades
ALTER TABLE public.perfil_unidades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "perfil_unidades_read" ON public.perfil_unidades;
CREATE POLICY "perfil_unidades_read" ON public.perfil_unidades FOR SELECT TO authenticated USING (true);
GRANT SELECT, INSERT, DELETE ON public.perfil_unidades TO authenticated;

-- Seed Data
DO $$ 
DECLARE
    estado_id UUID := 'e0000000-0000-0000-0000-000000000001';
    municipio_id UUID := 'd0000000-0000-0000-0000-000000000001';
    sec_edu_id UUID := 'b0000000-0000-0000-0000-000000000001';
    cargo_pref_id UUID := 'c0000000-0000-0000-0000-000000000001';
    cargo_sec_id UUID := 'c0000000-0000-0000-0000-000000000002';
    cargo_coord_id UUID := 'c0000000-0000-0000-0000-000000000003';
    cargo_dir_id UUID := 'c0000000-0000-0000-0000-000000000004';
    cargo_prof_id UUID := 'c0000000-0000-0000-0000-000000000005';
BEGIN
    -- Inserir Estado (tratar conflito de sigla)
    INSERT INTO public.estados (id, nome, sigla) VALUES (estado_id, 'Amazonas', 'AM') 
    ON CONFLICT (sigla) DO UPDATE SET nome = EXCLUDED.nome RETURNING id INTO estado_id;
    
    -- Inserir Município
    INSERT INTO public.municipios (id, nome, estado_id, ativo) VALUES (municipio_id, 'Manaus', estado_id, true) 
    ON CONFLICT (id) DO NOTHING;

    -- Inserir Secretarias
    INSERT INTO public.secretarias (id, nome, municipio_id) VALUES (sec_edu_id, 'Educação', municipio_id) ON CONFLICT (id) DO NOTHING;

    -- Inserir Unidades (Escolas)
    INSERT INTO public.unidades (id, nome, municipio_id, secretaria_id) VALUES 
    ('f0000000-0000-0000-0000-000000000001', 'Escola Municipal A', municipio_id, sec_edu_id),
    ('f0000000-0000-0000-0000-000000000002', 'Escola Municipal B', municipio_id, sec_edu_id),
    ('f0000000-0000-0000-0000-000000000003', 'Escola Municipal C', municipio_id, sec_edu_id)
    ON CONFLICT (id) DO NOTHING;

    -- Inserir Cargos
    INSERT INTO public.cargos (id, nome, secretaria_id, cargo_superior_id, escopo, pode_enviar_descendente, ordem_exibicao) VALUES
    (cargo_pref_id, 'Prefeito', NULL, NULL, 'municipio', true, 1),
    (cargo_sec_id, 'Secretário', sec_edu_id, cargo_pref_id, 'secretaria', true, 2),
    (cargo_coord_id, 'Coordenador', sec_edu_id, cargo_sec_id, 'multi_unidade', true, 3),
    (cargo_dir_id, 'Diretor', sec_edu_id, cargo_coord_id, 'unidade', true, 4),
    (cargo_prof_id, 'Professor', sec_edu_id, cargo_dir_id, 'unidade', false, 5)
    ON CONFLICT (id) DO NOTHING;
END $$;
