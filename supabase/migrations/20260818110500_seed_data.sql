-- Inserir Estado e Município
INSERT INTO public.estados (id, nome, sigla) VALUES (1, 'Amazonas', 'AM') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.municipios (id, nome, estado_id) VALUES (1, 'Manaus', 1) ON CONFLICT (id) DO NOTHING;

-- Inserir Secretarias
INSERT INTO public.secretarias (id, nome, municipio_id) VALUES 
(1, 'Administração', 1),
(2, 'Saúde', 1),
(3, 'Educação', 1),
(4, 'Obras', 1),
(5, 'Assistência Social', 1)
ON CONFLICT (id) DO NOTHING;

-- Inserir Unidades (Escolas)
INSERT INTO public.unidades (id, nome, secretaria_id, tipo) VALUES 
(1, 'Escola Municipal A', 3, 'escola'),
(2, 'Escola Municipal B', 3, 'escola'),
(3, 'Escola Municipal C', 3, 'escola')
ON CONFLICT (id) DO NOTHING;

-- Cargos (Garantir estrutura básica)
INSERT INTO public.cargos (id, nome, secretaria_id, nivel, ordem, pode_enviar_descendente) VALUES
('c1000000-0000-0000-0000-000000000001', 'Prefeito', NULL, 1, 1, true),
('c1000000-0000-0000-0000-000000000002', 'Secretário', 3, 2, 2, true),
('c1000000-0000-0000-0000-000000000003', 'Coordenador', 3, 3, 3, true),
('c1000000-0000-0000-0000-000000000004', 'Diretor', 3, 4, 4, true),
('c1000000-0000-0000-0000-000000000005', 'Professor', 3, 5, 5, false)
ON CONFLICT (id) DO NOTHING;
