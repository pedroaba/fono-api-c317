import { API_PREFIX } from "@/constants/common"
import { MAX_FEEDBACK_LENGTH } from "@/routes/pronounce-tests/constants"
import { createTestServer } from "../../helpers/server"
import { registerPronounceTestRoutes } from "../../helpers/routes"
import { sampleSessionTest } from "../../fixtures/data"
import { prismaMock } from "../../setup/prisma-mock"
import type { FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("Pronounce tests - validation edge cases", () => {
  let server: FastifyInstance

  beforeEach(async () => {
    server = createTestServer()
    await registerPronounceTestRoutes(server)
    await server.ready()
  })

  afterEach(async () => {
    await server.close()
  })

  it("rejects feedback that exceeds the maximum length on update", async () => {
    const response = await server.inject({
      method: "PATCH",
      url: `${API_PREFIX}/pronounce-tests/${sampleSessionTest.id}`,
      payload: {
        feedback: "a".repeat(MAX_FEEDBACK_LENGTH + 1),
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it("rejects creation when feedback is an empty string", async () => {
    const response = await server.inject({
      method: "POST",
      url: `${API_PREFIX}/pronounce-tests`,
      payload: {
        userId: sampleSessionTest.userId,
        sessionTestId: sampleSessionTest.id,
        feedback: "",
      },
    })

    expect(response.statusCode).toBe(400)
    expect(prismaMock.pronounceTest.create).not.toHaveBeenCalled()
  })
})

