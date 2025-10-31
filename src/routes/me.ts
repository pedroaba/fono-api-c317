import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import { auth } from "./hooks/auth"

export const meRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/me",
    {
      preHandler: [auth],
      schema: {
        tags: ["user"],
        summary: "Get current authenticated user profile",
        description:
          "Retrieves the profile information of the currently authenticated user. This endpoint requires a valid session cookie or session header for authentication.",
        security: [{ cookie: ["session"], session: ["session"] }],
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
          401: z.void().describe("Unauthorized - user not logged in"),
        },
      },
    },
    async (request, reply) => {
      const user = await request.getLoggedUser(request)
      if (!user) {
        return reply.status(STATUS_CODE.UNAUTHORIZED).send()
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    }
  )
}
