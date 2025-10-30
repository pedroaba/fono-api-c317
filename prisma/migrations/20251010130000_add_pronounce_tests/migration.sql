-- CreateTable
CREATE TABLE "pronounce_tests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionTestId" TEXT NOT NULL,
    "score" INTEGER,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pronounce_tests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pronounce_tests"
  ADD CONSTRAINT "pronounce_tests_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "pronounce_tests"
  ADD CONSTRAINT "pronounce_tests_sessionTestId_fkey"
  FOREIGN KEY ("sessionTestId") REFERENCES "session_tests"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
