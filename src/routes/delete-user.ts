import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import { prisma } from "@/lib/prisma"
import { Session } from "@/lib/session"
import { auth } from "./hooks/auth"

export const deleteUserRoute: FastifyPluginAsyncZod = async (server) => {
  await server.delete(
    "/:id",
    {
      preHandler: [auth],
      schema: {
        tags: ["user"],
        summary: "Delete user by id",
        description:
          "Deletes the user by id. This endpoint requires a valid session cookie or session header for authentication.",
        security: [{ cookie: ["session"], session: ["session"] }],
        params: z.object({
          id: z.string().describe("User id"),
        }),
        response: {
          204: z.void().describe("No content - user deleted successfully"),
          400: z.void().describe("Bad request - user id is required"),
          401: z.void().describe("Unauthorized - user not logged in"),
          404: z.void().describe("Not found - user not found"),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params

      if (!id) {
        return reply.status(STATUS_CODE.BAD_REQUEST).send()
      }

      const user = await prisma.user.findUnique({
        where: { id },
      })

      if (!user) {
        return reply.status(STATUS_CODE.NOT_FOUND).send()
      }

      await Session.invalidateOlderSessions(user.id)
      await prisma.user.delete({
        where: { id },
      })

      return reply.status(STATUS_CODE.NO_CONTENT).send()
    }
  )
}
