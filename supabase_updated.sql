create extension if not exists "pgcrypto";

create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  description text,
  contact_email text,
  created_at timestamptz default now()
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text not null,
  club_id uuid not null references clubs(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  club_id uuid not null references clubs(id) on delete cascade,
  position text,
  primary_skill text,
  jersey_number integer,
  dominant_hand text,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table players add column if not exists position text;
alter table players add column if not exists primary_skill text;
alter table players add column if not exists jersey_number integer;
alter table players add column if not exists dominant_hand text;
alter table players add column if not exists is_active boolean not null default true;

create table if not exists event_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  club_id uuid not null references clubs(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  player_id uuid references players(id) on delete set null,
  event_type_id uuid references event_types(id) on delete set null,
  timestamp_seconds double precision not null,
  created_at timestamptz default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  name text not null,
  category text,
  created_at timestamptz default now()
);

create table if not exists player_tags (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  club_id uuid not null references clubs(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists training_sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  title text not null,
  session_type text not null default 'training',
  starts_at timestamptz not null,
  created_at timestamptz default now()
);

create table if not exists training_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references training_sessions(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  club_id uuid not null references clubs(id) on delete cascade,
  status text not null default 'present',
  notes text,
  created_at timestamptz default now()
);

create table if not exists player_metric_logs (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  club_id uuid not null references clubs(id) on delete cascade,
  metric_name text not null,
  metric_value numeric not null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tags_club_id_name_key') then
    alter table tags add constraint tags_club_id_name_key unique (club_id, name);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'player_tags_player_id_tag_id_key') then
    alter table player_tags add constraint player_tags_player_id_tag_id_key unique (player_id, tag_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'training_attendance_session_id_player_id_key') then
    alter table training_attendance add constraint training_attendance_session_id_player_id_key unique (session_id, player_id);
  end if;
end $$;

create index if not exists idx_videos_club_id on videos(club_id);
create index if not exists idx_players_club_id on players(club_id);
create index if not exists idx_event_types_club_id on event_types(club_id);
create index if not exists idx_events_video_id on events(video_id);
create index if not exists idx_events_player_id on events(player_id);
create index if not exists idx_events_event_type_id on events(event_type_id);
create index if not exists idx_tags_club_id on tags(club_id);
create index if not exists idx_player_tags_player_id on player_tags(player_id);
create index if not exists idx_player_tags_tag_id on player_tags(tag_id);
create index if not exists idx_training_sessions_club_id on training_sessions(club_id);
create index if not exists idx_training_attendance_player_id on training_attendance(player_id);
create index if not exists idx_training_attendance_session_id on training_attendance(session_id);
create index if not exists idx_player_metric_logs_player_id on player_metric_logs(player_id);
create index if not exists idx_player_metric_logs_recorded_at on player_metric_logs(recorded_at desc);

alter table clubs enable row level security;
alter table videos enable row level security;
alter table players enable row level security;
alter table event_types enable row level security;
alter table events enable row level security;
alter table tags enable row level security;
alter table player_tags enable row level security;
alter table training_sessions enable row level security;
alter table training_attendance enable row level security;
alter table player_metric_logs enable row level security;

drop policy if exists "clubs_select" on clubs;
drop policy if exists "clubs_insert" on clubs;
drop policy if exists "clubs_update" on clubs;
drop policy if exists "clubs_delete" on clubs;
drop policy if exists "videos_all" on videos;
drop policy if exists "players_all" on players;
drop policy if exists "event_types_all" on event_types;
drop policy if exists "events_select" on events;
drop policy if exists "events_insert" on events;
drop policy if exists "events_update" on events;
drop policy if exists "events_delete" on events;
drop policy if exists "tags_all" on tags;
drop policy if exists "player_tags_select" on player_tags;
drop policy if exists "player_tags_insert" on player_tags;
drop policy if exists "player_tags_delete" on player_tags;
drop policy if exists "training_sessions_all" on training_sessions;
drop policy if exists "training_attendance_all" on training_attendance;
drop policy if exists "player_metric_logs_all" on player_metric_logs;

create policy "clubs_select"
on clubs
for select
using (true);

create policy "clubs_insert"
on clubs
for insert
with check (true);

create policy "clubs_update"
on clubs
for update
using (id::text = current_setting('request.headers', true)::json->>'x-club-id')
with check (id::text = current_setting('request.headers', true)::json->>'x-club-id');

create policy "clubs_delete"
on clubs
for delete
using (id::text = current_setting('request.headers', true)::json->>'x-club-id');

create policy "videos_all"
on videos
for all
using (club_id::text = current_setting('request.headers', true)::json->>'x-club-id')
with check (club_id::text = current_setting('request.headers', true)::json->>'x-club-id');

create policy "players_all"
on players
for all
using (club_id::text = current_setting('request.headers', true)::json->>'x-club-id')
with check (club_id::text = current_setting('request.headers', true)::json->>'x-club-id');

create policy "event_types_all"
on event_types
for all
using (club_id::text = current_setting('request.headers', true)::json->>'x-club-id')
with check (club_id::text = current_setting('request.headers', true)::json->>'x-club-id');

create policy "events_select"
on events
for select
using (
  exists (
    select 1
    from videos
    where videos.id = events.video_id
      and videos.club_id::text = current_setting('request.headers', true)::json->>'x-club-id'
  )
);

create policy "events_insert"
on events
for insert
with check (
  exists (
    select 1
    from videos
    where videos.id = events.video_id
      and videos.club_id::text = current_setting('request.headers', true)::json->>'x-club-id'
  )
);

create policy "events_update"
on events
for update
using (
  exists (
    select 1
    from videos
    where videos.id = events.video_id
      and videos.club_id::text = current_setting('request.headers', true)::json->>'x-club-id'
  )
)
with check (
  exists (
    select 1
    from videos
    where videos.id = events.video_id
      and videos.club_id::text = current_setting('request.headers', true)::json->>'x-club-id'
  )
);

create policy "events_delete"
on events
for delete
using (
  exists (
    select 1
    from videos
    where videos.id = events.video_id
      and videos.club_id::text = current_setting('request.headers', true)::json->>'x-club-id'
  )
);

create policy "tags_all"
on tags
for all
using (club_id::text = current_setting('request.headers', true)::json->>'x-club-id')
with check (club_id::text = current_setting('request.headers', true)::json->>'x-club-id');

create policy "player_tags_select"
on player_tags
for select
using (club_id::text = current_setting('request.headers', true)::json->>'x-club-id');

create policy "player_tags_insert"
on player_tags
for insert
with check (
  club_id::text = current_setting('request.headers', true)::json->>'x-club-id'
  and exists (
    select 1
    from players
    where players.id = player_tags.player_id
      and players.club_id::text = current_setting('request.headers', true)::json->>'x-club-id'
  )
  and exists (
    select 1
    from tags
    where tags.id = player_tags.tag_id
      and tags.club_id::text = current_setting('request.headers', true)::json->>'x-club-id'
  )
);

create policy "player_tags_delete"
on player_tags
for delete
using (club_id::text = current_setting('request.headers', true)::json->>'x-club-id');

create policy "training_sessions_all"
on training_sessions
for all
using (club_id::text = current_setting('request.headers', true)::json->>'x-club-id')
with check (club_id::text = current_setting('request.headers', true)::json->>'x-club-id');

create policy "training_attendance_all"
on training_attendance
for all
using (club_id::text = current_setting('request.headers', true)::json->>'x-club-id')
with check (
  club_id::text = current_setting('request.headers', true)::json->>'x-club-id'
  and exists (
    select 1
    from players
    where players.id = training_attendance.player_id
      and players.club_id::text = current_setting('request.headers', true)::json->>'x-club-id'
  )
  and exists (
    select 1
    from training_sessions
    where training_sessions.id = training_attendance.session_id
      and training_sessions.club_id::text = current_setting('request.headers', true)::json->>'x-club-id'
  )
);

create policy "player_metric_logs_all"
on player_metric_logs
for all
using (club_id::text = current_setting('request.headers', true)::json->>'x-club-id')
with check (
  club_id::text = current_setting('request.headers', true)::json->>'x-club-id'
  and exists (
    select 1
    from players
    where players.id = player_metric_logs.player_id
      and players.club_id::text = current_setting('request.headers', true)::json->>'x-club-id'
  )
);

drop policy if exists "club_logos_select" on storage.objects;
drop policy if exists "club_logos_insert" on storage.objects;
drop policy if exists "club_logos_update" on storage.objects;
drop policy if exists "club_logos_delete" on storage.objects;
drop policy if exists "videos_select" on storage.objects;
drop policy if exists "videos_insert" on storage.objects;
drop policy if exists "videos_update" on storage.objects;
drop policy if exists "videos_delete" on storage.objects;

create policy "club_logos_select"
on storage.objects
for select
using (
  bucket_id = 'club-logos'
  and split_part(name, '/', 1) = current_setting('request.headers', true)::json->>'x-club-id'
);

create policy "club_logos_insert"
on storage.objects
for insert
with check (
  bucket_id = 'club-logos'
  and split_part(name, '/', 1) = current_setting('request.headers', true)::json->>'x-club-id'
);

create policy "club_logos_update"
on storage.objects
for update
using (
  bucket_id = 'club-logos'
  and split_part(name, '/', 1) = current_setting('request.headers', true)::json->>'x-club-id'
)
with check (
  bucket_id = 'club-logos'
  and split_part(name, '/', 1) = current_setting('request.headers', true)::json->>'x-club-id'
);

create policy "club_logos_delete"
on storage.objects
for delete
using (
  bucket_id = 'club-logos'
  and split_part(name, '/', 1) = current_setting('request.headers', true)::json->>'x-club-id'
);

create policy "videos_select"
on storage.objects
for select
using (
  bucket_id = 'videos'
  and split_part(name, '/', 1) = current_setting('request.headers', true)::json->>'x-club-id'
);

create policy "videos_insert"
on storage.objects
for insert
with check (
  bucket_id = 'videos'
  and split_part(name, '/', 1) = current_setting('request.headers', true)::json->>'x-club-id'
);

create policy "videos_update"
on storage.objects
for update
using (
  bucket_id = 'videos'
  and split_part(name, '/', 1) = current_setting('request.headers', true)::json->>'x-club-id'
)
with check (
  bucket_id = 'videos'
  and split_part(name, '/', 1) = current_setting('request.headers', true)::json->>'x-club-id'
);

create policy "videos_delete"
on storage.objects
for delete
using (
  bucket_id = 'videos'
  and split_part(name, '/', 1) = current_setting('request.headers', true)::json->>'x-club-id'
);
