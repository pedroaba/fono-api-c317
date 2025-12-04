import { prefixBuilder } from "@/constants/common"
import { createTestServer } from "../../helpers/server"
import { registerPronouncesRoutes } from "../../helpers/routes"
import { samplePronounce, sampleUser } from "../../fixtures/data"
import { resetPrismaMock } from "../../mocks/prisma"
import { prismaMock } from "../../setup/prisma-mock"
import type { FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("POST /api/v1/pronounces", () => {
  let server: FastifyInstance
  const prefix = prefixBuilder("pronounces")

  beforeEach(async () => {
    resetPrismaMock(prismaMock)
    server = createTestServer()
    await registerPronouncesRoutes(server)
    await server.ready()
  })

  afterEach(async () => {
    await server.close()
  })

  it("creates a pronounce entry", async () => {
    prismaMock.pronounces.create.mockResolvedValue(samplePronounce)

    const payload = {
      word: samplePronounce.word,
      speak: samplePronounce.speak,
      userId: samplePronounce.userId,
    }

    const response = await server.inject({
      method: "POST",
      url: `${prefix}/`,
      payload,
    })

    expect(response.statusCode).toBe(201)
    expect(JSON.parse(response.body)).toEqual({ id: samplePronounce.id })
    expect(prismaMock.pronounces.create).toHaveBeenCalledWith({
      data: {
        feedback: "",
        userId: samplePronounce.userId,
        word: samplePronounce.word,
        speak: samplePronounce.speak,
        score: -1,
        embedding: [],
      },
    })
  })

  it("rejects invalid payloads", async () => {
    const response = await server.inject({
      method: "POST",
      url: `${prefix}/`,
      payload: {
        word: "",
        speak: [],
        userId: "not-a-uuid",
      },
    })

    expect(response.statusCode).toBe(400)
    expect(prismaMock.pronounces.create).not.toHaveBeenCalled()
  })
})

