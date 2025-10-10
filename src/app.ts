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
import { deleteUserRoute } from "./routes/delete-user"
import { fetchUsersRoute } from "./routes/fetch-users"
import { getUserRoute } from "./routes/get-user"
import { healthRoute } from "./routes/health"
import { meRoute } from "./routes/me"
import { getSessionPlugin } from "./routes/plugin/get-session"
import { signInRoute } from "./routes/sign-in"
import { updateUserRoute } from "./routes/update-user"

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

app.register(getSessionPlugin)

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
    components: {
      securitySchemes: {
        cookie: {
          type: "apiKey",
          name: "session",
          in: "cookie",
        },
        session: {
          type: "apiKey",
          name: "session",
          in: "header",
        },
      },
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

// =========== Health Routes ===========
app.register(healthRoute, {
  prefix: "/health",
})

app.register(healthRoute, {
  prefix: prefixBuilder("health"),
})

// =========== User Routes ===========
app.register(createUserRoute, {
  prefix: prefixBuilder("users"),
})

app.register(meRoute, {
  prefix: prefixBuilder("users"),
})

app.register(getUserRoute, {
  prefix: prefixBuilder("users"),
})

app.register(deleteUserRoute, {
  prefix: prefixBuilder("users"),
})

app.register(fetchUsersRoute, {
  prefix: prefixBuilder("users"),
})

app.register(updateUserRoute, {
  prefix: prefixBuilder("users"),
})

// =========== Auth Routes ===========
app.register(signInRoute, {
  prefix: prefixBuilder("auth"),
})
