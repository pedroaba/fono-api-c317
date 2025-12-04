import { API_PREFIX } from "@/constants/common"
import { createTestServer } from "../../helpers/server"
import { registerSessionTestRoutes } from "../../helpers/routes"
import { sampleSessionTest } from "../../fixtures/data"
import { resetPrismaMock } from "../../mocks/prisma"
import { prismaMock } from "../../setup/prisma-mock"
import type { FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("DELETE /api/v1/session-tests/:id", () => {
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

  it("deletes a session test when it exists", async () => {
    prismaMock.sessionTest.findUnique.mockResolvedValue(sampleSessionTest)
    prismaMock.sessionTest.delete.mockResolvedValue(sampleSessionTest)

    const response = await server.inject({
      method: "DELETE",
      url: `${API_PREFIX}/session-tests/${sampleSessionTest.id}`,
    })

    expect(response.statusCode).toBe(204)
    expect(prismaMock.sessionTest.delete).toHaveBeenCalledWith({
      where: { id: sampleSessionTest.id },
    })
  })

  it("returns 404 when the session test is missing", async () => {
    prismaMock.sessionTest.findUnique.mockResolvedValue(null)

    const response = await server.inject({
      method: "DELETE",
      url: `${API_PREFIX}/session-tests/${sampleSessionTest.id}`,
    })

    expect(response.statusCode).toBe(404)
    expect(JSON.parse(response.body)).toEqual({ error: "Not found" })
    expect(prismaMock.sessionTest.delete).not.toHaveBeenCalled()
  })
})

