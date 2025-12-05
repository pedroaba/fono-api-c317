import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { env } from "../env"

// Simple transcription stub so the audio-transcription-api container has the expected endpoint
export const transcribeFileRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    "/api/v1/transcribe/file",
    {
      schema: {
        consumes: ["multipart/form-data"],
        tags: ["transcription"],
        body: z.any(),
        response: {
          200: z.object({
            text: z.string(),
            language: z.string().optional(),
            confidence: z.number().optional(),
            duration: z.number().optional(),
          }),
          400: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const file = await (request as any).file()
      if (!file) {
        return reply.status(400).send({ error: "file field is required" })
      }

      // Consume stream to avoid leaks
      await file.toBuffer()

      return {
        text: env.EXPECTED_TRANSCRIPTION || "Transcricao mock",
        language: "pt-BR",
        confidence: 0.9,
        duration: 0,
      }
    }
  )
}
