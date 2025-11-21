import { prefixBuilder } from "@/constants/common"
import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@/constants/validation"
import { createTestServer } from "../../helpers/server"
import { registerPronouncesRoutes } from "../../helpers/routes"
import { samplePronounce, sampleUser } from "../../fixtures/data"
import { resetPrismaMock } from "../../mocks/prisma"
import { prismaMock } from "../../setup/prisma-mock"
import type { FastifyInstance } from "fastify"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("GET /api/v1/pronounces", () => {
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

  it("lists pronounces with filters, pagination, and relations", async () => {
    const pronounceWithRelations = {
      ...samplePronounce,
      pronounceTests: [
        { id: "pt-1", score: 10, feedback: "nice" },
        { id: "pt-2", score: null, feedback: null },
      ],
      user: {
        id: sampleUser.id,
        email: sampleUser.email,
        name: sampleUser.name,
      },
    }

    prismaMock.pronounces.findMany.mockResolvedValue([pronounceWithRelations as any])
    prismaMock.pronounces.count.mockResolvedValue(1)

    const response = await server.inject({
      method: "GET",
      url: `${prefix}/`,
      query: {
        word: "hel",
        userId: sampleUser.id,
        page: 2,
        limit: 10,
      },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body).toEqual({
      pronounces: [
        {
          id: pronounceWithRelations.id,
          word: pronounceWithRelations.word,
          speak: pronounceWithRelations.speak,
          embedding: pronounceWithRelations.embedding,
          score: pronounceWithRelations.score,
          feedback: pronounceWithRelations.feedback,
          pronounceTests: pronounceWithRelations.pronounceTests,
          user: pronounceWithRelations.user,
          createdAt: pronounceWithRelations.createdAt.toISOString(),
          updatedAt: pronounceWithRelations.updatedAt.toISOString(),
        },
      ],
      total: 1,
    })

    expect(prismaMock.pronounces.findMany).toHaveBeenCalledWith({
      where: {
        word: { contains: "hel", mode: "insensitive" },
        userId: { equals: sampleUser.id },
      },
      skip: 10,
      take: 10,
      include: {
        pronounceTests: {
          select: {
            id: true,
            score: true,
            feedback: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })
    expect(prismaMock.pronounces.count).toHaveBeenCalledWith({
      where: {
        word: { contains: "hel" },
        userId: { equals: sampleUser.id },
      },
    })
  })

  it("falls back to defaults when no query is provided", async () => {
    prismaMock.pronounces.findMany.mockResolvedValue([])
    prismaMock.pronounces.count.mockResolvedValue(0)

    const response = await server.inject({
      method: "GET",
      url: `${prefix}/`,
    })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      pronounces: [],
      total: 0,
    })
    expect(prismaMock.pronounces.findMany).toHaveBeenCalledWith({
      where: {
        word: undefined,
        userId: undefined,
      },
      skip: (DEFAULT_PAGE - 1) * DEFAULT_LIMIT,
      take: DEFAULT_LIMIT,
      include: {
        pronounceTests: {
          select: {
            id: true,
            score: true,
            feedback: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })
  })
})

