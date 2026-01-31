-- Customer profiles: one per customer, structured fields
-- Enforces 1:1 with customers via PK/FK and application logic

CREATE TABLE IF NOT EXISTS customer_profiles (
    customer_id UUID PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,

    -- Structured profile fields
    summary TEXT,
    primary_intent VARCHAR(255),
    preferred_channel VARCHAR(50),
    sentiment_trend VARCHAR(20) CHECK (sentiment_trend IN ('improving', 'stable', 'declining', NULL)),
    key_topics TEXT[] DEFAULT '{}',
    product_affinities JSONB DEFAULT '{}',

    last_summary_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- One profile per customer: customer_id is PK (no duplicate rows possible)

-- Index for "recently updated profiles" / stale-profile backfill
CREATE INDEX IF NOT EXISTS idx_customer_profiles_last_summary_at ON customer_profiles(last_summary_at);

-- GIN index for topic search (e.g. WHERE key_topics && ARRAY['billing'])
CREATE INDEX IF NOT EXISTS idx_customer_profiles_key_topics ON customer_profiles USING GIN(key_topics);

-- Trigger for updated_at (reuse existing function from 001)
DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON customer_profiles;
CREATE TRIGGER update_customer_profiles_updated_at
    BEFORE UPDATE ON customer_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE customer_profiles IS 'One row per customer; structured AI-derived profile fields.';

-- Composite index: messages by session ordered by time (common query pattern)
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_sent_at
    ON chat_messages(session_id, sent_at);

-- Composite index: sessions by customer and start time
CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer_started
    ON chat_sessions(customer_id, started_at DESC);
