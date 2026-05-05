-- AlterTable
ALTER TABLE "cafes" ADD COLUMN     "amenities" TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "language" VARCHAR(5) NOT NULL DEFAULT 'en';
