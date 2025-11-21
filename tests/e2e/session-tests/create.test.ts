import { API_PREFIX } from "@/constants/common"
import { createTestServer } from "../../helpers/server"
import { registerSessionTestRoutes } from "../../helpers/routes"
import { sampleSessionTest, sampleUser } from "../../fixtures/data"
import { resetPrismaMock } from "../../mocks/prisma"
import { prismaMock } from "../../setup/prisma-mock"
import type { FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("POST /api/v1/session-tests", () => {
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

  it("creates a session test when the user exists", async () => {
    prismaMock.user.findUnique.mockResolvedValue(sampleUser)
    prismaMock.sessionTest.create.mockResolvedValue({
      id: sampleSessionTest.id,
    } as any)

    const response = await server.inject({
      method: "POST",
      url: `${API_PREFIX}/session-tests`,
      payload: { userId: sampleUser.id },
    })

    expect(response.statusCode).toBe(201)
    expect(JSON.parse(response.body)).toEqual({ id: sampleSessionTest.id })
    expect(prismaMock.sessionTest.create).toHaveBeenCalledWith({
      data: { userId: sampleUser.id },
      select: { id: true },
    })
  })

  it("returns 404 when the user is missing", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    const response = await server.inject({
      method: "POST",
      url: `${API_PREFIX}/session-tests`,
      payload: { userId: sampleUser.id },
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ error: "User not found" })
    expect(prismaMock.sessionTest.create).not.toHaveBeenCalled()
  })

  it("rejects invalid payloads", async () => {
    const response = await server.inject({
      method: "POST",
      url: `${API_PREFIX}/session-tests`,
      payload: {},
    })

    expect(response.statusCode).toBe(400)
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled()
  })
})

