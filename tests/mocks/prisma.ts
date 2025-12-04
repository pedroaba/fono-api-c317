import type { PrismaClient } from "@prisma/client"
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended"

export type PrismaMock = DeepMockProxy<PrismaClient>

export function createPrismaMock(): PrismaMock {
  return mockDeep<PrismaClient>()
}

export function resetPrismaMock(mock: PrismaMock) {
  mockReset(mock)
}

