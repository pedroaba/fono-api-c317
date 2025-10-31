-- AlterTable
ALTER TABLE "pronounce_tests" ADD COLUMN     "pronouncesId" TEXT;

-- CreateTable
CREATE TABLE "pronounces" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "speak" INTEGER[],
    "embedding" INTEGER[],
    "score" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pronounces_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pronounce_tests" ADD CONSTRAINT "pronounce_tests_pronouncesId_fkey" FOREIGN KEY ("pronouncesId") REFERENCES "pronounces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pronounces" ADD CONSTRAINT "pronounces_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
