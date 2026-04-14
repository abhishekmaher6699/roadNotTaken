ALTER TABLE pins
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE pins
SET updated_at = created_at
WHERE updated_at IS NULL;
