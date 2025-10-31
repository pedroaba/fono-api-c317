import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"

export const healthRoute: FastifyPluginAsyncZod = async (server) => {
  server.get(
    "/health",
    {
      schema: {
        tags: ["health"],
        summary: "Health check",
        response: {
          200: z.object({ status: z.string() }).describe("Health check ok!"),
        },
      },
    },
    async () => ({ status: "ok" })
  )
}
