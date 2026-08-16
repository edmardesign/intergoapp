-- Allow users to upload to their own folder
create policy "Users can upload attachments"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'anexos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to see their own uploads
create policy "Users can see their own uploads"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'anexos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to see attachments sent to them
create policy "Users can see attachments they received"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'anexos' AND
    exists (
        select 1 
        from public.anexos a
        join public.mensagens m on a.mensagem_id = m.id
        join public.mensagem_destinatarios md on m.id = md.mensagem_id
        where a.url = storage.objects.name
        and (m.remetente_id = auth.uid() or md.destinatario_id = auth.uid())
    )
);

-- Allow users to delete their own uploads before sending
create policy "Users can delete their own uploads"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'anexos' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
