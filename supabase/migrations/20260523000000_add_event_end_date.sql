-- Add optional end date to calendar_events to support multi-day event ranges
-- (e.g. germination May 30 – Jun 5, harvest Aug 8 – Aug 18)
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS event_end_date timestamptz;
