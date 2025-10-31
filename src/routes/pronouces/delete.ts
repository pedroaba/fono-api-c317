import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import { prisma } from "@/lib/prisma"

export const deletePronounceRoute: FastifyPluginAsyncZod = async (server) => {
  server.delete(
    "/:id",
    {
      schema: {
        tags: ["pronounces"],
        summary: "Delete a pronounce",
        params: z
          .object({
            id: z.cuid().describe("The ID of the pronounce to delete"),
          })
          .meta({
            example: {
              id: "123e4567-e89b-12d3-a456-426614174000",
            },
          }),
        response: {
          200: z.void().describe("Health check ok!"),
          404: z.void().describe("Pronounce not found"),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params

      const pronounceOnDb = await prisma.pronounces.findUnique({
        where: {
          id,
        },
      })

      if (!pronounceOnDb) {
        return reply.status(STATUS_CODE.NOT_FOUND).send()
      }

      await prisma.pronounces.delete({
        where: {
          id,
        },
      })

      return reply.status(STATUS_CODE.OK).send()
    }
  )
}
