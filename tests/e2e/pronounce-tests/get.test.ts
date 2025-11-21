import { API_PREFIX } from "@/constants/common"
import { createTestServer } from "../../helpers/server"
import { registerPronounceTestRoutes } from "../../helpers/routes"
import { samplePronounceTest, sampleSessionTest } from "../../fixtures/data"
import { resetPrismaMock } from "../../mocks/prisma"
import { prismaMock } from "../../setup/prisma-mock"
import type { FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("GET /api/v1/pronounce-tests", () => {
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

  it("lists pronounce tests for a user with optional session filter", async () => {
    prismaMock.pronounceTest.findMany.mockResolvedValue([
      samplePronounceTest,
    ])

    const response = await server.inject({
      method: "GET",
      url: `${API_PREFIX}/pronounce-tests`,
      query: {
        userId: sampleSessionTest.userId,
        sessionTestId: sampleSessionTest.id,
      },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.items).toEqual([
      {
        id: samplePronounceTest.id,
        userId: samplePronounceTest.userId,
        sessionTestId: samplePronounceTest.sessionTestId,
        score: samplePronounceTest.score,
        feedback: samplePronounceTest.feedback,
        createdAt: samplePronounceTest.createdAt.toISOString(),
        updatedAt: samplePronounceTest.updatedAt.toISOString(),
      },
    ])

    expect(prismaMock.pronounceTest.findMany).toHaveBeenCalledWith({
      where: {
        userId: sampleSessionTest.userId,
        sessionTestId: sampleSessionTest.id,
      },
      orderBy: { createdAt: "desc" },
    })
  })

  it("gets a pronounce test by id", async () => {
    prismaMock.pronounceTest.findUnique.mockResolvedValue(samplePronounceTest)

    const response = await server.inject({
      method: "GET",
      url: `${API_PREFIX}/pronounce-tests/${samplePronounceTest.id}`,
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      id: samplePronounceTest.id,
      userId: samplePronounceTest.userId,
      sessionTestId: samplePronounceTest.sessionTestId,
      score: samplePronounceTest.score,
      feedback: samplePronounceTest.feedback,
      createdAt: samplePronounceTest.createdAt.toISOString(),
      updatedAt: samplePronounceTest.updatedAt.toISOString(),
    })
    expect(prismaMock.pronounceTest.findUnique).toHaveBeenCalledWith({
      where: { id: samplePronounceTest.id },
    })
  })

  it("returns 404 when pronounce test is not found", async () => {
    prismaMock.pronounceTest.findUnique.mockResolvedValue(null)

    const response = await server.inject({
      method: "GET",
      url: `${API_PREFIX}/pronounce-tests/${samplePronounceTest.id}`,
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({
      error: "Pronounce test not found",
    })
  })
})

