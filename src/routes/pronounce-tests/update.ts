import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import { prisma } from "@/lib/prisma"
import { MAX_FEEDBACK_LENGTH } from "./constants"

const updateBodySchema = z
  .object({
    score: z.number().int().min(0).optional(),
    feedback: z
      .string()
      .trim()
      .min(1, "feedback cannot be empty")
      .max(
        MAX_FEEDBACK_LENGTH,
        `feedback cannot exceed ${MAX_FEEDBACK_LENGTH} characters`
      )
      .optional(),
  })
  .refine(
    (data) => data.score !== undefined || data.feedback !== undefined,
    "At least one field must be provided"
  )

export const pronounceTestsUpdateRoute: FastifyPluginAsyncZod = async (
  server
) => {
  server.patch(
    "/pronounce-tests/:id",
    {
      schema: {
        tags: ["pronounce-tests"],
        summary: "Update pronounce test",
        params: z.object({ id: z.string() }),
        body: updateBodySchema,
        response: {
          200: z.object({
            id: z.string(),
            userId: z.string(),
            sessionTestId: z.string(),
            score: z.number().int().nullable(),
            feedback: z.string().nullable(),
            createdAt: z.string(),
            updatedAt: z.string(),
          }),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const payload = request.body

      const existing = await prisma.pronounceTest.findUnique({ where: { id } })

      if (!existing) {
        return reply
          .status(STATUS_CODE.NOT_FOUND)
          .send({ error: "Pronounce test not found" })
      }

      const updated = await prisma.pronounceTest.update({
        where: { id },
        data: {
          ...(payload.score !== undefined ? { score: payload.score } : {}),
          ...(payload.feedback !== undefined
            ? { feedback: payload.feedback }
            : {}),
        },
      })

      return {
        id: updated.id,
        userId: updated.userId,
        sessionTestId: updated.sessionTestId,
        score: updated.score ?? null,
        feedback: updated.feedback ?? null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      }
    }
  )
}
