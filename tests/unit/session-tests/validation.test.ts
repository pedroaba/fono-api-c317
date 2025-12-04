import { API_PREFIX } from "@/constants/common"
import { createTestServer } from "../../helpers/server"
import { registerSessionTestRoutes } from "../../helpers/routes"
import { prismaMock } from "../../setup/prisma-mock"
import type { FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("Session tests - validation", () => {
  let server: FastifyInstance

  beforeEach(async () => {
    server = createTestServer()
    await registerSessionTestRoutes(server)
    await server.ready()
  })

  afterEach(async () => {
    await server.close()
  })

  it("requires userId when listing session tests", async () => {
    const response = await server.inject({
      method: "GET",
      url: `${API_PREFIX}/session-tests`,
    })

    expect(response.statusCode).toBe(400)
    expect(prismaMock.sessionTest.findMany).not.toHaveBeenCalled()
  })

  it("rejects empty userId values", async () => {
    const response = await server.inject({
      method: "GET",
      url: `${API_PREFIX}/session-tests`,
      query: { userId: "" },
    })

    expect(response.statusCode).toBe(400)
    expect(prismaMock.sessionTest.findMany).not.toHaveBeenCalled()
  })
})

