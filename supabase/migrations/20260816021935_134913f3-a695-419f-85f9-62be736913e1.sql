CREATE OR REPLACE FUNCTION public.perfis_subarvore(superior_id_root UUID)
RETURNS TABLE (id UUID)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE subarvore AS (
        -- Base case: direct subordinates of the root
        SELECT p.id
        FROM public.perfis p
        WHERE p.superior_id = superior_id_root
        
        UNION
        
        -- Recursive case: subordinates of subordinates
        SELECT p.id
        FROM public.perfis p
        INNER JOIN subarvore s ON p.superior_id = s.id
    )
    SELECT s.id FROM subarvore s;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.perfis_subarvore(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.perfis_subarvore(UUID) TO service_role;
