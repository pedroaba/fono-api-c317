import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import { prisma } from "@/lib/prisma"
import { auth } from "./hooks/auth"

export const logoutRoute: FastifyPluginAsyncZod = async (server) => {
  await server.get(
    "/logout",
    {
      preHandler: [auth],
      schema: {
        tags: ["user"],
        summary: "Logout current authenticated user",
        description:
          "Logs out the currently authenticated user. This endpoint requires a valid session cookie or session header for authentication.",
        security: [{ cookie: ["session"], session: ["session"] }],
        response: {
          204: z.void().describe("No content - user logged out successfully"),
          401: z.void().describe("Unauthorized - user not logged in"),
        },
      },
    },
    async (request, reply) => {
      const { session } = await request.getSession(request)
      if (!session) {
        return reply.status(STATUS_CODE.UNAUTHORIZED).send()
      }

      await prisma.session.update({
        where: { id: session.id },
        data: {
          invalidatedAt: new Date(),
        },
      })

      return reply.status(STATUS_CODE.NO_CONTENT).send()
    }
  )
}
