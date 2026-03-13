/*
  # Add 'transplant' to calendar_events category constraint

  Extends the CHECK constraint on calendar_events.category to allow
  the new 'transplant' event type created automatically when a seed
  with a transplant_date is saved.
*/

ALTER TABLE calendar_events
  DROP CONSTRAINT IF EXISTS calendar_events_category_check;

ALTER TABLE calendar_events
  ADD CONSTRAINT calendar_events_category_check
  CHECK (category IN ('sow', 'purchase', 'harvest', 'germination', 'transplant'));
