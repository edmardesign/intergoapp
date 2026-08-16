CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  estado_id uuid,
  cidade_texto text,
  criado_em timestamptz DEFAULT now()
);

GRANT ALL ON public.waitlist TO service_role;
GRANT INSERT ON public.waitlist TO anon, authenticated;

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insertion to waitlist"
ON public.waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Ensure perfis table exists with correct schema as per requirements
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perfil_status') THEN
    CREATE TYPE public.perfil_status AS ENUM ('pendente', 'ativo', 'negado', 'inativo');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.perfis (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome_completo text NOT NULL,
  cpf text NOT NULL,
  telefone text NOT NULL,
  cep text NOT NULL,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  municipio_id uuid,
  secretaria_id uuid,
  nivel_id uuid,
  unidade_id uuid,
  superior_id uuid,
  status public.perfil_status DEFAULT 'pendente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT ALL ON public.perfis TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.perfis TO authenticated;

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own profile"
ON public.perfis
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
ON public.perfis
FOR SELECT
TO authenticated
USING (auth.uid() = id);
