import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from "@/constants/validation"
import { prisma } from "@/lib/prisma"

export const getPronouncesRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/",
    {
      schema: {
        tags: ["pronounces"],
        summary: "List of pronounces",
        querystring: z.object({
          word: z.string().optional().describe("Word filter"),
          userId: z.string().optional().describe("User ID filter"),
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
              pronounces: z.array(
                z.object({
                  id: z.string(),
                  word: z.string(),
                  speak: z.array(z.number()),
                  embedding: z.array(z.number()),
                  score: z.number(),
                  feedback: z.string(),
                  pronounceTests: z.array(
                    z.object({
                      id: z.string(),
                      score: z.number().nullable(),
                      feedback: z.string().nullable(),
                    })
                  ),
                  user: z.object({
                    id: z.string(),
                    email: z.string(),
                    name: z.string(),
                  }),
                  createdAt: z.date(),
                  updatedAt: z.date(),
                })
              ),
              total: z.number(),
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
        },
      },
    },
    async (request, reply) => {
      const { word, userId, page, limit } = request.query
      const skip = (page - 1) * limit

      const pronounces = await prisma.pronounces.findMany({
        where: {
          word: word ? { contains: word, mode: "insensitive" } : undefined,
          userId: userId ? { equals: userId, mode: "insensitive" } : undefined,
        },
        skip,
        take: limit,
        include: {
          pronounceTests: {
            select: {
              id: true,
              score: true,
              feedback: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      })

      const total = await prisma.pronounces.count({
        where: {
          word: word ? { contains: word } : undefined,
          userId: userId ? { equals: userId } : undefined,
        },
      })

      return reply.status(STATUS_CODE.OK).send({
        pronounces,
        total,
      })
    }
  )
}
