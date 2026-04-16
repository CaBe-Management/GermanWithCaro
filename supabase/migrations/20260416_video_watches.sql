-- Tracks which videos a user has manually marked as "gelernt" (learned/done)
create table if not exists gwc_video_learned (
  session_id  uuid        not null,
  video_id    uuid        not null references gwc_videos(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (session_id, video_id)
);

alter table gwc_video_learned enable row level security;

create policy "Allow all for any session" on gwc_video_learned
  for all using (true) with check (true);
