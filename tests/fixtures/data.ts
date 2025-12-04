import type {
  PronounceTest,
  Pronounces,
  SessionTest,
  User,
} from "@prisma/client"

const baseDate = new Date("2025-01-01T00:00:00.000Z")

export const sampleUser: User = {
  id: "8f42e8ce-1d6a-4c88-a08e-a76b5a1a3c4e",
  email: "user@example.com",
  password: "hashed",
  name: "Test User",
  createdAt: baseDate,
  updatedAt: baseDate,
}

export const sampleSessionTest: SessionTest = {
  id: "session-test-1",
  userId: sampleUser.id,
  createdAt: baseDate,
  updatedAt: baseDate,
  sessionId: null,
}

export const samplePronounceTest: PronounceTest = {
  id: "pronounce-test-1",
  userId: sampleUser.id,
  sessionTestId: sampleSessionTest.id,
  score: 90,
  feedback: "Well done",
  createdAt: baseDate,
  updatedAt: baseDate,
  sessionId: null,
  pronouncesId: null,
}

export const samplePronounce: Pronounces = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  word: "hello",
  speak: [1, 2, 3, 4],
  embedding: [],
  score: 10,
  feedback: "",
  userId: sampleUser.id,
  createdAt: baseDate,
  updatedAt: baseDate,
}

