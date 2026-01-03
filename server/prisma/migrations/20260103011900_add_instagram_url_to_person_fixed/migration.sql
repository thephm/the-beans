-- AlterTable - Add instagramUrl column to roaster_people if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'roaster_people' 
        AND column_name = 'instagramUrl'
    ) THEN
        ALTER TABLE "roaster_people" ADD COLUMN "instagramUrl" TEXT;
    END IF;
END $$;

-- AddForeignKey - Add reviews userId foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'reviews_userId_fkey'
        AND table_name = 'reviews'
    ) THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
