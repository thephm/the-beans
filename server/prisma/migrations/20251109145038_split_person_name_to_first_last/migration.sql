/*
  Warnings:

  - You are about to drop the column `name` on the `roaster_people` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `roaster_people` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add new columns as nullable first
ALTER TABLE "roaster_people" 
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT;

-- Step 2: Migrate existing data - split name into firstName and lastName
UPDATE "roaster_people"
SET 
  "firstName" = CASE 
    WHEN position(' ' in name) > 0 THEN split_part(name, ' ', 1)
    ELSE name
  END,
  "lastName" = CASE 
    WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
    ELSE NULL
  END
WHERE name IS NOT NULL;

-- Step 3: Make firstName NOT NULL now that data is migrated
ALTER TABLE "roaster_people" 
ALTER COLUMN "firstName" SET NOT NULL;

-- Step 4: Drop the old name column
ALTER TABLE "roaster_people" 
DROP COLUMN "name";
