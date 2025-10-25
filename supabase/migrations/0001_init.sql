create extension if not exists "uuid-ossp";

-- Create workspace role enum if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_type where typname = 'workspace_role') then
    create type public.workspace_role as enum ('owner', 'editor', 'viewer');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  icon text,
  owner_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role public.workspace_role not null default 'editor',
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (workspace_id, user_id)
);

create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  parent_id uuid references public.documents on delete cascade,
  title text not null default 'Untitled',
  icon text,
  cover_image_url text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.blocks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents on delete cascade,
  type text not null default 'paragraph',
  content jsonb not null default '{}'::jsonb,
  position numeric not null default 1,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (document_id, position)
);

create index if not exists idx_documents_workspace on public.documents(workspace_id);
create index if not exists idx_blocks_document on public.blocks(document_id);
create index if not exists idx_workspace_members_user on public.workspace_members(user_id);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger set_workspaces_updated_at
  before update on public.workspaces
  for each row execute procedure public.handle_updated_at();

create trigger set_documents_updated_at
  before update on public.documents
  for each row execute procedure public.handle_updated_at();

create trigger set_blocks_updated_at
  before update on public.blocks
  for each row execute procedure public.handle_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.documents enable row level security;
alter table public.blocks enable row level security;

create policy "Individuals can manage their profile"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Workspace members read workspaces"
  on public.workspaces
  for select using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspaces.id
        and workspace_members.user_id = auth.uid()
    )
  );

create policy "Workspace owners manage workspaces"
  on public.workspaces
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Members manage membership"
  on public.workspace_members
  for select using (user_id = auth.uid())
  with check (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'editor')
    )
  );

create policy "Members read documents"
  on public.documents
  for select using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = documents.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  );

create policy "Editors manage documents"
  on public.documents
  for all using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = documents.workspace_id
        and workspace_members.user_id = auth.uid()
        and workspace_members.role in ('owner', 'editor')
    )
  ) with check (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = documents.workspace_id
        and workspace_members.user_id = auth.uid()
        and workspace_members.role in ('owner', 'editor')
    )
  );

create policy "Members read blocks"
  on public.blocks
  for select using (
    exists (
      select 1 from public.documents d
      join public.workspace_members wm on wm.workspace_id = d.workspace_id
      where d.id = blocks.document_id
        and wm.user_id = auth.uid()
    )
  );

create policy "Editors manage blocks"
  on public.blocks
  for all using (
    exists (
      select 1 from public.documents d
      join public.workspace_members wm on wm.workspace_id = d.workspace_id
      where d.id = blocks.document_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'editor')
    )
  ) with check (
    exists (
      select 1 from public.documents d
      join public.workspace_members wm on wm.workspace_id = d.workspace_id
      where d.id = blocks.document_id
        and wm.user_id = auth.uid()
        and wm.role in ('owner', 'editor')
    )
  );
