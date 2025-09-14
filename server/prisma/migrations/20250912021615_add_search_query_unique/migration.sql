/*
  Warnings:

  - A unique constraint covering the columns `[query]` on the table `Search` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Search_query_key" ON "Search"("query");
