-- Add group_id column to domains table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'domains'
        AND column_name = 'group_id'
    ) THEN
        ALTER TABLE domains ADD COLUMN group_id INTEGER REFERENCES domain_groups(id) ON DELETE SET NULL;
    END IF;
END $$;