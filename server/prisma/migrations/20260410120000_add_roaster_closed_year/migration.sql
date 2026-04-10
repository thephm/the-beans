-- Add closedYear column to roasters if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='roasters' AND column_name='closedYear'
    ) THEN
        ALTER TABLE "roasters" ADD COLUMN "closedYear" INTEGER;
    END IF;
END$$;
