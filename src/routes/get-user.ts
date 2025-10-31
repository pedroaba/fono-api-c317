import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import { prisma } from "@/lib/prisma"
import { auth } from "./hooks/auth"

export const getUserRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/:id",
    {
      preHandler: [auth],
      schema: {
        tags: ["user"],
        summary: "Get user by id",
        description:
          "Retrieves the profile information of the user by id. This endpoint requires a valid session cookie or session header for authentication.",
        security: [{ cookie: ["session"], session: ["session"] }],
        params: z.object({
          id: z.string().describe("User id"),
        }),
        response: {
          200: z
            .object({ id: z.string(), email: z.string(), name: z.string() })
            .describe("User information")
            .meta({
              example: {
                id: "cm123abc456def789",
                email: "user@example.com",
                name: "John Doe",
              },
            }),
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

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    }
  )
}
