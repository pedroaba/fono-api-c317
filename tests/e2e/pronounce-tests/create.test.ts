import { API_PREFIX } from "@/constants/common"
import { createTestServer } from "../../helpers/server"
import { registerPronounceTestRoutes } from "../../helpers/routes"
import { samplePronounceTest, sampleSessionTest } from "../../fixtures/data"
import { resetPrismaMock } from "../../mocks/prisma"
import { prismaMock } from "../../setup/prisma-mock"
import type { FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("POST /api/v1/pronounce-tests", () => {
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

  it("creates a pronounce test when the session test exists", async () => {
    prismaMock.sessionTest.findFirst.mockResolvedValue(sampleSessionTest)
    prismaMock.pronounceTest.create.mockResolvedValue({
      id: samplePronounceTest.id,
    } as any)

    const response = await server.inject({
      method: "POST",
      url: `${API_PREFIX}/pronounce-tests`,
      payload: {
        userId: sampleSessionTest.userId,
        sessionTestId: sampleSessionTest.id,
        score: 75,
        feedback: "Great job",
      },
    })

    expect(response.statusCode).toBe(201)
    expect(JSON.parse(response.body)).toEqual({ id: samplePronounceTest.id })
    expect(prismaMock.sessionTest.findFirst).toHaveBeenCalledWith({
      where: { id: sampleSessionTest.id, userId: sampleSessionTest.userId },
    })
    expect(prismaMock.pronounceTest.create).toHaveBeenCalledWith({
      data: {
        userId: sampleSessionTest.userId,
        sessionTestId: sampleSessionTest.id,
        score: 75,
        feedback: "Great job",
      },
      select: { id: true },
    })
  })

  it("creates without optional fields and omits them in the payload", async () => {
    prismaMock.sessionTest.findFirst.mockResolvedValue(sampleSessionTest)
    prismaMock.pronounceTest.create.mockResolvedValue({
      id: "pronounce-test-optional",
    } as any)

    const response = await server.inject({
      method: "POST",
      url: `${API_PREFIX}/pronounce-tests`,
      payload: {
        userId: sampleSessionTest.userId,
        sessionTestId: sampleSessionTest.id,
      },
    })

    expect(response.statusCode).toBe(201)
    expect(JSON.parse(response.body)).toEqual({
      id: "pronounce-test-optional",
    })
    expect(prismaMock.pronounceTest.create).toHaveBeenCalledWith({
      data: {
        userId: sampleSessionTest.userId,
        sessionTestId: sampleSessionTest.id,
      },
      select: { id: true },
    })
  })

  it("returns 404 when the session test does not exist", async () => {
    prismaMock.sessionTest.findFirst.mockResolvedValue(null)

    const response = await server.inject({
      method: "POST",
      url: `${API_PREFIX}/pronounce-tests`,
      payload: {
        userId: sampleSessionTest.userId,
        sessionTestId: sampleSessionTest.id,
      },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({
      error: "Session test not found",
    })
    expect(prismaMock.pronounceTest.create).not.toHaveBeenCalled()
  })

  it("fails validation when required fields are missing", async () => {
    const response = await server.inject({
      method: "POST",
      url: `${API_PREFIX}/pronounce-tests`,
      payload: {},
    })

    expect(response.statusCode).toBe(400)
    expect(prismaMock.pronounceTest.create).not.toHaveBeenCalled()
  })
})

