import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import { prisma } from "@/lib/prisma"

export const createPronounceRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/",
    {
      schema: {
        tags: ["pronounces"],
        summary: "Create a pronouce",
        description:
          "Creates a new pronouce with word, speak, and userId. The word must be unique and the speak must be at least 1 character long.",
        body: z
          .object({
            word: z.string().min(1).describe("Word to be pronounced"),
            speak: z
              .array(z.int())
              .describe("Array of integers representing pronunciation audio"),
            userId: z.uuid().describe("User's id"),
          })
          .meta({
            example: {
              word: "hello",
              speak: [1, 5, 3, 8, 2, 7, 4, 6, 9, 1, 3, 5, 8, 2],
              userId: "asankoln213n12kl3n1",
            },
          }),
        response: {
          201: z
            .object({
              id: z.uuid().describe("Id of the created pronouce"),
            })
            .describe("Response object for creating a pronouce")
            .meta({
              example: {
                id: "asankoln213n12kl3n1",
              },
            }),
        },
      },
    },
    async (request, reply) => {
      const { speak, userId, word } = request.body

      const pronouce = await prisma.pronounces.create({
        data: {
          feedback: "",
          userId,
          word,
          speak,
          score: -1,
          embedding: [],
        },
      })

      return reply.status(STATUS_CODE.CREATED).send({
        id: pronouce.id,
      })
    }
  )
}
