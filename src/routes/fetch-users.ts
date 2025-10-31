import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from "@/constants/validation"
import { prisma } from "@/lib/prisma"
import { auth } from "./hooks/auth"

export const fetchUsersRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/",
    {
      preHandler: [auth],
      schema: {
        tags: ["user"],
        summary: "Get all users",
        description:
          "Retrieves the profile information of all users. This endpoint requires a valid session cookie or session header for authentication.",
        security: [{ cookie: ["session"], session: ["session"] }],
        querystring: z.object({
          name: z.string().optional().describe("Name filter"),
          email: z.string().optional().describe("Email filter"),
          page: z.coerce
            .number()
            .min(DEFAULT_PAGE)
            .default(DEFAULT_PAGE)
            .describe("Page number (default: 1)"),
          limit: z.coerce
            .number()
            .min(DEFAULT_LIMIT)
            .max(MAX_LIMIT)
            .default(DEFAULT_LIMIT)
            .describe("Limit per page (default: 10)"),
        }),
        response: {
          200: z
            .object({
              users: z.array(
                z.object({
                  id: z.string(),
                  email: z.string(),
                  name: z.string(),
                })
              ),
              count: z.number(),
            })
            .describe("User information")
            .meta({
              example: {
                users: [
                  {
                    id: "cm123abc456def789",
                    email: "user@example.com",
                    name: "John Doe",
                  },
                ],
                count: 1,
              },
            }),
          401: z.void().describe("Unauthorized - user not logged in"),
        },
      },
    },
    async (request) => {
      const { page, limit, name, email } = request.query
      const skip = (page - 1) * limit

      const users = await prisma.user.findMany({
        skip,
        take: limit,
        where: {
          name: name ? { contains: name, mode: "insensitive" } : undefined,
          email: email ? { contains: email, mode: "insensitive" } : undefined,
        },
      })
      const count = await prisma.user.count({
        where: {
          name: name ? { contains: name, mode: "insensitive" } : undefined,
          email: email ? { contains: email, mode: "insensitive" } : undefined,
        },
      })

      return {
        users,
        count,
      }
    }
  )
}
