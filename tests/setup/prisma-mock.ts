import { createPrismaMock } from "../mocks/prisma"
import { beforeEach, vi } from "vitest"

export const prismaMock = createPrismaMock()

vi.doMock("@/lib/prisma", () => ({ prisma: prismaMock }))

beforeEach(() => {
})

export { resetPrismaMock }

