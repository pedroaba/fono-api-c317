import { API_PREFIX } from "@/constants/common"
import { createTestServer } from "../../helpers/server"
import { registerPronounceTestRoutes } from "../../helpers/routes"
import { samplePronounceTest } from "../../fixtures/data"
import { resetPrismaMock } from "../../mocks/prisma"
import { prismaMock } from "../../setup/prisma-mock"
import type { FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("DELETE /api/v1/pronounce-tests/:id", () => {
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

  it("deletes an existing pronounce test", async () => {
    prismaMock.pronounceTest.findUnique.mockResolvedValue(samplePronounceTest)
    prismaMock.pronounceTest.delete.mockResolvedValue(samplePronounceTest)

    const response = await server.inject({
      method: "DELETE",
      url: `${API_PREFIX}/pronounce-tests/${samplePronounceTest.id}`,
    })

    expect(response.statusCode).toBe(204)
    expect(prismaMock.pronounceTest.delete).toHaveBeenCalledWith({
      where: { id: samplePronounceTest.id },
    })
  })

  it("returns 404 when the pronounce test is missing", async () => {
    prismaMock.pronounceTest.findUnique.mockResolvedValue(null)

    const response = await server.inject({
      method: "DELETE",
      url: `${API_PREFIX}/pronounce-tests/${samplePronounceTest.id}`,
    })

    expect(response.statusCode).toBe(404)
    expect(prismaMock.pronounceTest.delete).not.toHaveBeenCalled()
  })
})

