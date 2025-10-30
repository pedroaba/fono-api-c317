import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import { prisma } from "@/lib/prisma"

export const pronounceTestsDeleteRoute: FastifyPluginAsyncZod = async (
  server,
) => {
  await server.delete(
    "/pronounce-tests/:id",
    {
      schema: {
        tags: ["pronounce-tests"],
        summary: "Delete pronounce test",
        params: z.object({ id: z.string() }),
        response: {
          204: z.any(),
          404: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params

      const existing = await prisma.pronounceTest.findUnique({
        where: { id },
      })

      if (!existing) {
        return reply
          .status(STATUS_CODE.NOT_FOUND)
          .send({ error: "Pronounce test not found" })
      }

      await prisma.pronounceTest.delete({ where: { id } })

      reply.status(STATUS_CODE.NO_CONTENT)
      return
    },
  )
}
