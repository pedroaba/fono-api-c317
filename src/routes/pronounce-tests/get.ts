import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import { prisma } from "@/lib/prisma"

const pronounceTestSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionTestId: z.string(),
  score: z.number().int().nullable(),
  feedback: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const pronounceTestsGetRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/pronounce-tests",
    {
      schema: {
        tags: ["pronounce-tests"],
        summary: "List pronounce tests",
        querystring: z.object({
          userId: z.string().min(1, "userId is required"),
          sessionTestId: z.string().min(1).optional(),
        }),
        response: {
          200: z.object({
            items: z.array(pronounceTestSchema),
          }),
        },
      },
    },
    async (request) => {
      const { userId, sessionTestId } = request.query
      const items = await prisma.pronounceTest.findMany({
        where: {
          userId,
          ...(sessionTestId ? { sessionTestId } : {}),
        },
        orderBy: { createdAt: "desc" },
      })

      return {
        items: items.map((item) => ({
          id: item.id,
          userId: item.userId,
          sessionTestId: item.sessionTestId,
          score: item.score ?? null,
          feedback: item.feedback ?? null,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })),
      }
    }
  )

  server.get(
    "/pronounce-tests/:id",
    {
      schema: {
        tags: ["pronounce-tests"],
        summary: "Get pronounce test",
        params: z.object({ id: z.string() }),
        response: {
          200: pronounceTestSchema,
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const pronounceTest = await prisma.pronounceTest.findUnique({
        where: { id },
      })

      if (!pronounceTest) {
        return reply
          .status(STATUS_CODE.NOT_FOUND)
          .send({ error: "Pronounce test not found" })
      }

      return {
        id: pronounceTest.id,
        userId: pronounceTest.userId,
        sessionTestId: pronounceTest.sessionTestId,
        score: pronounceTest.score ?? null,
        feedback: pronounceTest.feedback ?? null,
        createdAt: pronounceTest.createdAt.toISOString(),
        updatedAt: pronounceTest.updatedAt.toISOString(),
      }
    }
  )
}
