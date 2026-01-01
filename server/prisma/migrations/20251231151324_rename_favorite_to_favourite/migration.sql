

-- Only run the rename if the 'favorite' table exists
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorite') THEN
		-- 1. Rename the table
		EXECUTE 'ALTER TABLE "favorite" RENAME TO "favourites"';

		-- 2. Rename primary key constraint if needed
		EXECUTE 'ALTER INDEX IF EXISTS "favorite_pkey" RENAME TO "favourites_pkey"';

		-- 3. Rename unique index if it exists
		EXECUTE 'ALTER INDEX IF EXISTS "favorite_userId_roasterId_key" RENAME TO "favourites_userId_roasterId_key"';

		-- 4. Drop old foreign keys (if needed) and add new ones with correct names
		EXECUTE 'ALTER TABLE "favourites" DROP CONSTRAINT IF EXISTS "favorite_roasterId_fkey"';
		EXECUTE 'ALTER TABLE "favourites" DROP CONSTRAINT IF EXISTS "favorite_userId_fkey"';

		EXECUTE 'ALTER TABLE "favourites" ADD CONSTRAINT "favourites_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "roasters"("id") ON DELETE RESTRICT ON UPDATE CASCADE';
		EXECUTE 'ALTER TABLE "favourites" ADD CONSTRAINT "favourites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE';
	END IF;
END$$;
