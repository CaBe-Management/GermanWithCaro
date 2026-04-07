-- Migration: add audio URL column to gwc_stories
-- Run this in your Supabase SQL editor
-- Upload audio files to Supabase Storage, then paste the public URL here

ALTER TABLE gwc_stories ADD COLUMN IF NOT EXISTS audio_url TEXT;
