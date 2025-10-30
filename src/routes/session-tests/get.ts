import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import { prisma } from "@/lib/prisma"

export const sessionTestsGetRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/session-tests",
    {
      schema: {
        tags: ["session-tests"],
        summary: "List session tests by user",
        querystring: z.object({
          userId: z.string().min(1, "userId is required"),
        }),
        response: {
          200: z
            .object({
              items: z.array(
                z.object({
                  id: z.string(),
                  userId: z.string(),
                  createdAt: z.string(),
                  updatedAt: z.string(),
                })
              ),
            })
            .describe("Session tests list"),
        },
      },
    },
    async (request) => {
      const { userId } = request.query

      const items = await prisma.sessionTest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })

      return {
        items: items.map((i) => ({
          id: i.id,
          userId: i.userId,
          createdAt: i.createdAt.toISOString(),
          updatedAt: i.updatedAt.toISOString(),
        })),
      }
    }
  )

  // Get one session test by id
  server.get(
    "/session-tests/:id",
    {
      schema: {
        tags: ["session-tests"],
        summary: "Get session test",
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({
            id: z.string(),
            userId: z.string(),
            createdAt: z.string(),
            updatedAt: z.string(),
          }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const item = await prisma.sessionTest.findUnique({ where: { id } })
      if (!item) {
        return reply.status(STATUS_CODE.NOT_FOUND).send({ error: "Not found" })
      }
      return {
        id: item.id,
        userId: item.userId,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }
    }
  )
}
