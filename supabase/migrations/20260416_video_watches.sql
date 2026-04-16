-- Video watches: tracks which videos a user has opened/seen
create table if not exists gwc_video_watches (
  session_id  uuid        not null,
  video_id    uuid        not null references gwc_videos(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (session_id, video_id)
);

alter table gwc_video_watches enable row level security;

-- No sensitive data — allow anyone to read/write their own session rows
create policy "Allow all for any session" on gwc_video_watches
  for all using (true) with check (true);
