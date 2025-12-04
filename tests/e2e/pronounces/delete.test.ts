import { prefixBuilder } from "@/constants/common"
import { createTestServer } from "../../helpers/server"
import { registerPronouncesRoutes } from "../../helpers/routes"
import { samplePronounce } from "../../fixtures/data"
import { resetPrismaMock } from "../../mocks/prisma"
import { prismaMock } from "../../setup/prisma-mock"
import type { FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("DELETE /api/v1/pronounces/:id", () => {
  let server: FastifyInstance
  const prefix = prefixBuilder("pronounces")
  const pronounceId = "cjld2cjxh0000qzrmn831i7rn"

  beforeEach(async () => {
    resetPrismaMock(prismaMock)
    server = createTestServer()
    await registerPronouncesRoutes(server)
    await server.ready()
  })

  afterEach(async () => {
    await server.close()
  })

  it("deletes a pronounce entry", async () => {
    const pronounce = { ...samplePronounce, id: pronounceId }
    prismaMock.pronounces.findUnique.mockResolvedValue(pronounce as any)
    prismaMock.pronounces.delete.mockResolvedValue(pronounce as any)

    const response = await server.inject({
      method: "DELETE",
      url: `${prefix}/${pronounceId}`,
    })

    expect(response.statusCode).toBe(200)
    expect(prismaMock.pronounces.delete).toHaveBeenCalledWith({
      where: { id: pronounceId },
    })
  })

  it("returns 404 when pronounce does not exist", async () => {
    prismaMock.pronounces.findUnique.mockResolvedValue(null)

    const response = await server.inject({
      method: "DELETE",
      url: `${prefix}/${pronounceId}`,
    })

    expect(response.statusCode).toBe(404)
    expect(prismaMock.pronounces.delete).not.toHaveBeenCalled()
  })
})

