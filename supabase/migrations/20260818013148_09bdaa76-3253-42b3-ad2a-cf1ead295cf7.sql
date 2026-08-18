
-- Enum para auditoria
DO $$ BEGIN
    CREATE TYPE public.auditoria_acao AS ENUM ('aprovacao', 'negativa', 'reatribuicao_lotacao');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela de Auditoria
CREATE TABLE IF NOT EXISTS public.auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id) NOT NULL,
    delegou_de_id UUID REFERENCES auth.users(id), -- Quem o usuário está representando (ex: Vice-Diretor representando Diretor)
    acao public.auditoria_acao NOT NULL,
    entidade TEXT NOT NULL,
    entidade_id UUID NOT NULL,
    detalhes JSONB,
    criado_em TIMESTAMPTZ DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT ON public.auditoria TO authenticated;
GRANT ALL ON public.auditoria TO service_role;

ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Usuários veem sua própria auditoria" 
    ON public.auditoria FOR SELECT TO authenticated 
    USING (auth.uid() = usuario_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Atualização da tabela perfis para suporte a aprovação
ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS motivo_negativa TEXT;

-- Função para verificar se um cargo é delegado de outro
CREATE OR REPLACE FUNCTION public.is_delegado(_user_id UUID, _target_perfil_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_cargo_id UUID;
    v_target_superior_id UUID;
    v_user_delegado BOOLEAN;
BEGIN
    -- Busca cargo do usuário e se ele é delegado
    SELECT nivel_id, c.delegado_do_superior INTO v_user_cargo_id, v_user_delegado
    FROM public.perfis p
    JOIN public.cargos c ON p.nivel_id = c.id
    WHERE p.id = _user_id;

    -- Se não for delegado, retorna false
    IF v_user_delegado IS NOT TRUE THEN
        RETURN FALSE;
    END IF;

    -- Busca superior do alvo
    SELECT superior_id INTO v_target_superior_id
    FROM public.perfis
    WHERE id = _target_perfil_id;

    -- Verifica se o usuário é o delegado do superior do alvo
    RETURN EXISTS (
        SELECT 1 FROM public.perfis p_user
        JOIN public.perfis p_target ON p_user.superior_id = p_target.superior_id
        WHERE p_user.id = _user_id AND p_target.id = _target_perfil_id
    );
END;
$$;

-- Função recursiva para obter a subárvore hierárquica
CREATE OR REPLACE FUNCTION public.get_subarvore_recursiva(root_id UUID)
RETURNS TABLE (id UUID) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE subarvore AS (
        SELECT p.id FROM public.perfis p WHERE p.superior_id = root_id
        UNION ALL
        SELECT p.id FROM public.perfis p 
        JOIN subarvore s ON p.superior_id = s.id
    )
    SELECT s.id FROM subarvore s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC para buscar equipe com dados completos
CREATE OR REPLACE FUNCTION public.get_equipe_detalhada(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_root_id UUID;
    v_is_delegado BOOLEAN;
    v_superior_real_id UUID;
BEGIN
    -- Verifica se o usuário é delegado
    SELECT c.delegado_do_superior, p.superior_id INTO v_is_delegado, v_superior_real_id
    FROM public.perfis p
    JOIN public.cargos c ON p.nivel_id = c.id
    WHERE p.id = _user_id;

    -- Define de onde começa a árvore
    IF v_is_delegado IS TRUE AND v_superior_real_id IS NOT NULL THEN
        v_root_id := v_superior_real_id;
    ELSE
        v_root_id := _user_id;
    END IF;

    RETURN (
        SELECT jsonb_agg(t)
        FROM (
            WITH sub_ids AS (
                SELECT v_root_id as pid
                UNION
                SELECT id FROM public.get_subarvore_recursiva(v_root_id)
            )
            SELECT 
                p.id,
                p.nome_completo,
                p.status,
                p.superior_id,
                c.nome as cargo_nome,
                (
                    SELECT jsonb_agg(u.nome)
                    FROM public.perfil_unidades pu
                    JOIN public.unidades u ON pu.unidade_id = u.id
                    WHERE pu.perfil_id = p.id
                ) as unidades,
                p.cpf,
                p.telefone,
                p.cep,
                p.logradouro,
                p.numero,
                p.complemento,
                p.bairro
            FROM public.perfis p
            JOIN public.cargos c ON p.nivel_id = c.id
            WHERE p.id IN (SELECT pid FROM sub_ids)
              AND p.id != _user_id
        ) t
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_equipe_detalhada(UUID) TO authenticated;

-- RPC para Secretário: Lotação de Coordenadores
CREATE OR REPLACE FUNCTION public.get_lotacao_coordenadores(_municipio_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(t)
        FROM (
            SELECT 
                u.id as unidade_id,
                u.nome as unidade_nome,
                p.id as coordenador_id,
                p.nome_completo as coordenador_nome
            FROM public.unidades u
            LEFT JOIN public.perfil_unidades pu ON u.id = pu.unidade_id
            LEFT JOIN public.perfis p ON pu.perfil_id = p.id AND p.nivel_id IN (
                SELECT id FROM public.cargos WHERE nome ILIKE '%Coordenador%'
            )
            WHERE u.municipio_id = _municipio_id
            ORDER BY u.nome
        ) t
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_lotacao_coordenadores(UUID) TO authenticated;
