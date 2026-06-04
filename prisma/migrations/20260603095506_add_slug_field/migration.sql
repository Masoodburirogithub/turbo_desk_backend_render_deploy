/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `case_studies` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "case_studies" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "case_studies_slug_key" ON "case_studies"("slug");
