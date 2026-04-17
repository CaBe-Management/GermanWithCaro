-- Add sentences_done flag to gwc_videos for admin workflow tracking
alter table gwc_videos add column if not exists sentences_done boolean not null default false;
