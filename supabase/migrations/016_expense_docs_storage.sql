-- Create public bucket for expense receipts/invoices
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-docs',
  'expense-docs',
  true,
  10485760,  -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do nothing;

-- Authenticated users can upload (landlords only in practice — RLS on their data)
create policy "authenticated users can upload expense docs"
on storage.objects for insert
to authenticated
with check (bucket_id = 'expense-docs');

-- Users can only delete files inside their own folder (uid is first path segment)
create policy "users can delete their own expense docs"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'expense-docs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Update is not needed — we upload new files and delete old ones
-- Public read: the bucket is marked public so Supabase handles this automatically
