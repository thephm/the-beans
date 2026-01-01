-- Add missing columns to roasters table if they do not exist (resilient for dev environments)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='roasters' AND column_name='city'
    ) THEN
        ALTER TABLE "roasters" ADD COLUMN "city" TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='roasters' AND column_name='state'
    ) THEN
        ALTER TABLE "roasters" ADD COLUMN "state" TEXT;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='roasters' AND column_name='country'
    ) THEN
        ALTER TABLE "roasters" ADD COLUMN "country" TEXT DEFAULT 'US';
    END IF;
END$$;
