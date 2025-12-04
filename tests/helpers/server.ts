import fastify from "fastify"
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod"

export function createTestServer() {
  const server = fastify({ logger: false }).withTypeProvider<ZodTypeProvider>()
  server.setSerializerCompiler(serializerCompiler)
  server.setValidatorCompiler(validatorCompiler)
  return server
}

