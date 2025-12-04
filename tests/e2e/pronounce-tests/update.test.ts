import { API_PREFIX } from "@/constants/common"
import { createTestServer } from "../../helpers/server"
import { registerPronounceTestRoutes } from "../../helpers/routes"
import { samplePronounceTest } from "../../fixtures/data"
import { resetPrismaMock } from "../../mocks/prisma"
import { prismaMock } from "../../setup/prisma-mock"
import type { FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("PATCH /api/v1/pronounce-tests/:id", () => {
  let server: FastifyInstance

  beforeEach(async () => {
    resetPrismaMock(prismaMock)
    server = createTestServer()
    await registerPronounceTestRoutes(server)
    await server.ready()
  })

  afterEach(async () => {
    await server.close()
  })

  it("updates score and feedback when pronounce test exists", async () => {
    prismaMock.pronounceTest.findUnique.mockResolvedValue(samplePronounceTest)
    prismaMock.pronounceTest.update.mockResolvedValue({
      ...samplePronounceTest,
      score: 99,
      feedback: "Updated feedback",
      updatedAt: new Date("2025-01-02T00:00:00.000Z"),
    })

    const response = await server.inject({
      method: "PATCH",
      url: `${API_PREFIX}/pronounce-tests/${samplePronounceTest.id}`,
      payload: { score: 99, feedback: "Updated feedback" },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      id: samplePronounceTest.id,
      userId: samplePronounceTest.userId,
      sessionTestId: samplePronounceTest.sessionTestId,
      score: 99,
      feedback: "Updated feedback",
      createdAt: samplePronounceTest.createdAt.toISOString(),
      updatedAt: new Date("2025-01-02T00:00:00.000Z").toISOString(),
    })
    expect(prismaMock.pronounceTest.update).toHaveBeenCalledWith({
      where: { id: samplePronounceTest.id },
      data: { score: 99, feedback: "Updated feedback" },
    })
  })

  it("returns 404 when pronounce test does not exist", async () => {
    prismaMock.pronounceTest.findUnique.mockResolvedValue(null)

    const response = await server.inject({
      method: "PATCH",
      url: `${API_PREFIX}/pronounce-tests/${samplePronounceTest.id}`,
      payload: { feedback: "Missing entity" },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({
      error: "Pronounce test not found",
    })
    expect(prismaMock.pronounceTest.update).not.toHaveBeenCalled()
  })

  it("rejects requests without updatable fields", async () => {
    const response = await server.inject({
      method: "PATCH",
      url: `${API_PREFIX}/pronounce-tests/${samplePronounceTest.id}`,
      payload: {},
    })

    expect(response.statusCode).toBe(400)
    expect(prismaMock.pronounceTest.update).not.toHaveBeenCalled()
  })
})

