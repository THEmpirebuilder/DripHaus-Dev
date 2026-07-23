-- =====================================================================
-- DripHaus — Bucket de stockage « media » (images articles, avatars, posts)
-- À APPLIQUER sur le projet Supabase (non joué automatiquement).
-- Les images sont publiques en lecture ; l'écriture est limitée au dossier
-- de l'utilisateur : chemin = "{auth.uid}/....".
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Lecture publique
create policy "media_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

-- Upload uniquement dans son propre dossier ({uid}/...)
create policy "media_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Mise à jour / suppression réservées au propriétaire de l'objet
create policy "media_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and owner = auth.uid());

create policy "media_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and owner = auth.uid());
