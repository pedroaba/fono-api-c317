import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import { prisma } from "@/lib/prisma"

const MAX_FEEDBACK_LENGTH = 1024

export const pronounceTestsCreateRoute: FastifyPluginAsyncZod = async (
  server
) => {
  await server.post(
    "/pronounce-tests",
    {
      schema: {
        tags: ["pronounce-tests"],
        summary: "Create pronounce test",
        body: z.object({
          userId: z.string().min(1, "userId is required"),
          sessionTestId: z.string().min(1, "sessionTestId is required"),
          score: z.number().int().min(0).optional(),
          feedback: z
            .string()
            .trim()
            .min(1, "feedback cannot be empty")
            .max(MAX_FEEDBACK_LENGTH, "feedback is too long")
            .optional(),
        }),
        response: {
          201: z
            .object({ id: z.string() })
            .describe("Pronounce test created successfully"),
          404: z
            .object({ error: z.string() })
            .describe("Session test not found"),
        },
      },
    },
    async (request, reply) => {
      const { userId, sessionTestId, score, feedback } = request.body

      const sessionTest = await prisma.sessionTest.findFirst({
        where: { id: sessionTestId, userId },
      })

      if (!sessionTest) {
        return reply
          .status(STATUS_CODE.NOT_FOUND)
          .send({ error: "Session test not found" })
      }

      const pronounceTest = await prisma.pronounceTest.create({
        data: {
          userId,
          sessionTestId,
          ...(score !== undefined ? { score } : {}),
          ...(feedback !== undefined ? { feedback } : {}),
        },
        select: { id: true },
      })

      return reply.status(STATUS_CODE.CREATED).send(pronounceTest)
    }
  )
}
