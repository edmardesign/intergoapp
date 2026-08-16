create type public.mensagem_tipo as enum ('comunicado', 'demanda', 'reuniao', 'evento');

create table public.mensagens (
    id uuid primary key default gen_random_uuid(),
    remetente_id uuid references public.perfis(id) on delete cascade not null,
    tipo public.mensagem_tipo not null,
    payload jsonb not null,
    exigir_confirmacao boolean not null default false,
    urgente boolean not null default false,
    created_at timestamptz not null default now()
);

create table public.mensagem_destinatarios (
    mensagem_id uuid references public.mensagens(id) on delete cascade not null,
    destinatario_id uuid references public.perfis(id) on delete cascade not null,
    entregue_em timestamptz,
    lido_em timestamptz,
    confirmado_em timestamptz,
    primary key (mensagem_id, destinatario_id)
);

create table public.anexos (
    id uuid primary key default gen_random_uuid(),
    mensagem_id uuid references public.mensagens(id) on delete cascade not null,
    nome text not null,
    url text not null,
    tamanho bigint not null,
    tipo_mime text not null,
    created_at timestamptz not null default now()
);

-- Grants
grant select, insert on public.mensagens to authenticated;
grant all on public.mensagens to service_role;

grant select, insert, update on public.mensagem_destinatarios to authenticated;
grant all on public.mensagem_destinatarios to service_role;

grant select, insert on public.anexos to authenticated;
grant all on public.anexos to service_role;

-- RLS
alter table public.mensagens enable row level security;
alter table public.mensagem_destinatarios enable row level security;
alter table public.anexos enable row level security;

create policy "Users can see messages they sent or received"
on public.mensagens
for select
to authenticated
using (
    remetente_id = auth.uid() OR
    id in (
        select mensagem_id 
        from public.mensagem_destinatarios 
        where destinatario_id = auth.uid()
    )
);

create policy "Users can send messages"
on public.mensagens
for insert
to authenticated
with check (remetente_id = auth.uid());

create policy "Users can see their recipient status"
on public.mensagem_destinatarios
for select
to authenticated
using (
    destinatario_id = auth.uid() OR
    mensagem_id in (
        select id 
        from public.mensagens 
        where remetente_id = auth.uid()
    )
);

create policy "Users can insert recipients for messages they send"
on public.mensagem_destinatarios
for insert
to authenticated
with check (
    mensagem_id in (
        select id 
        from public.mensagens 
        where remetente_id = auth.uid()
    )
);

create policy "Users can update their own receipt status"
on public.mensagem_destinatarios
for update
to authenticated
using (destinatario_id = auth.uid())
with check (destinatario_id = auth.uid());

create policy "Users can see attachments for messages they can see"
on public.anexos
for select
to authenticated
using (
    mensagem_id in (
        select id 
        from public.mensagens
    )
);

create policy "Users can insert attachments for messages they send"
on public.anexos
for insert
to authenticated
with check (
    mensagem_id in (
        select id 
        from public.mensagens 
        where remetente_id = auth.uid()
    )
);
