-- CreateTable
CREATE TABLE "session_tests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_tests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "session_tests" ADD CONSTRAINT "session_tests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

