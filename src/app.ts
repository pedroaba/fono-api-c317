import cookie from "@fastify/cookie"
import fastifyCors from "@fastify/cors"
import { fastifySwagger } from "@fastify/swagger"
import fastify from "fastify"
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod"
import { prefixBuilder } from "./constants/common"
import { env } from "./env"
import { createUserRoute } from "./routes/create-user"
import { healthRoute } from "./routes/health"
import { signInRoute } from "./routes/sign-in"

export const app = fastify({
  logger: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
}).withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
})

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(cookie, {
  secret: env.SECRET_KEY,
  prefix: "fono",
})

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Fono API",
      version: "1.0.0",
    },
  },
  transform: jsonSchemaTransform,
})

app.register(import("@scalar/fastify-api-reference"), {
  routePrefix: "/reference",
  configuration: {
    title: "Fono API Reference",
    pageTitle: "Fono API Reference",
    theme: "fastify",
  },
})

app.register(healthRoute, {
  prefix: "/health",
})

app.register(healthRoute, {
  prefix: prefixBuilder("health"),
})

app.register(createUserRoute, {
  prefix: prefixBuilder("users"),
})

app.register(signInRoute, {
  prefix: prefixBuilder("auth"),
})
