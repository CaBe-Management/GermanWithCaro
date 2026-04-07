-- Migration: add English translation column to gwc_stories
-- Run this in your Supabase SQL editor

ALTER TABLE gwc_stories ADD COLUMN IF NOT EXISTS content_en TEXT;
