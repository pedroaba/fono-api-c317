import { API_PREFIX } from "@/constants/common"
import { createTestServer } from "../../helpers/server"
import { registerSessionTestRoutes } from "../../helpers/routes"
import { sampleSessionTest, sampleUser } from "../../fixtures/data"
import { resetPrismaMock } from "../../mocks/prisma"
import { prismaMock } from "../../setup/prisma-mock"
import type { FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("GET /api/v1/session-tests", () => {
  let server: FastifyInstance

  beforeEach(async () => {
    resetPrismaMock(prismaMock)
    server = createTestServer()
    await registerSessionTestRoutes(server)
    await server.ready()
  })

  afterEach(async () => {
    await server.close()
  })

  it("lists session tests by user", async () => {
    prismaMock.sessionTest.findMany.mockResolvedValue([sampleSessionTest])

    const response = await server.inject({
      method: "GET",
      url: `${API_PREFIX}/session-tests`,
      query: { userId: sampleUser.id },
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      items: [
        {
          id: sampleSessionTest.id,
          userId: sampleSessionTest.userId,
          createdAt: sampleSessionTest.createdAt.toISOString(),
          updatedAt: sampleSessionTest.updatedAt.toISOString(),
        },
      ],
    })
    expect(prismaMock.sessionTest.findMany).toHaveBeenCalledWith({
      where: { userId: sampleUser.id },
      orderBy: { createdAt: "desc" },
    })
  })

  it("gets a session test by id", async () => {
    prismaMock.sessionTest.findUnique.mockResolvedValue(sampleSessionTest)

    const response = await server.inject({
      method: "GET",
      url: `${API_PREFIX}/session-tests/${sampleSessionTest.id}`,
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      id: sampleSessionTest.id,
      userId: sampleSessionTest.userId,
      createdAt: sampleSessionTest.createdAt.toISOString(),
      updatedAt: sampleSessionTest.updatedAt.toISOString(),
    })
  })

  it("returns 404 when the session test is not found", async () => {
    prismaMock.sessionTest.findUnique.mockResolvedValue(null)

    const response = await server.inject({
      method: "GET",
      url: `${API_PREFIX}/session-tests/missing`,
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ error: "Not found" })
  })
})

