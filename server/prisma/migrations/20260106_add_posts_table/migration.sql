-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "roasterId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "socialNetwork" VARCHAR(20) NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "posts_roasterId_idx" ON "posts"("roasterId");

-- CreateIndex
CREATE INDEX "posts_postedAt_idx" ON "posts"("postedAt");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_roasterId_fkey" FOREIGN KEY ("roasterId") REFERENCES "roasters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
