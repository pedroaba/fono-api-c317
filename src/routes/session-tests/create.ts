import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import { prisma } from "@/lib/prisma"

export const sessionTestsCreateRoute: FastifyPluginAsyncZod = async (
  server
) => {
  server.post(
    "/session-tests",
    {
      schema: {
        tags: ["session-tests"],
        summary: "Create a new session test",
        body: z.object({
          userId: z.string().min(1, "userId is required"),
        }),
        response: {
          201: z
            .object({ id: z.string() })
            .describe("Session test created successfully"),
          400: z
            .object({ error: z.string() })
            .describe("Bad request - invalid input"),
          404: z.object({ error: z.string() }).describe("User not found"),
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.body

      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        return reply
          .status(STATUS_CODE.NOT_FOUND)
          .send({ error: "User not found" })
      }

      const session = await prisma.sessionTest.create({
        data: { userId },
        select: { id: true },
      })

      reply.status(STATUS_CODE.CREATED)
      return session
    }
  )
}
