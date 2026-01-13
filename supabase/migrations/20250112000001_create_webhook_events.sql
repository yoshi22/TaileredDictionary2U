-- Webhook Events table for idempotency
-- Prevents duplicate processing of Stripe webhook events

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by stripe_event_id
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id
  ON webhook_events(stripe_event_id);

-- Index for querying by event type
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type
  ON webhook_events(event_type);

-- Comment for documentation
COMMENT ON TABLE webhook_events IS 'Stores processed Stripe webhook events for idempotency';
COMMENT ON COLUMN webhook_events.stripe_event_id IS 'Unique event ID from Stripe (evt_xxx)';
COMMENT ON COLUMN webhook_events.event_type IS 'Stripe event type (e.g., checkout.session.completed)';
COMMENT ON COLUMN webhook_events.payload IS 'Full event payload for debugging/auditing';
