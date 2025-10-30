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
import { API_PREFIX, prefixBuilder } from "./constants/common"
import { env } from "./env"
import { createUserRoute } from "./routes/create-user"
import { deleteUserRoute } from "./routes/delete-user"
import { fetchUsersRoute } from "./routes/fetch-users"
import { getUserRoute } from "./routes/get-user"
import { healthRoute } from "./routes/health"
import { logoutRoute } from "./routes/logout"
import { meRoute } from "./routes/me"
import { getSessionPlugin } from "./routes/plugin/get-session"
import { pronounceTestsCreateRoute } from "./routes/pronounce-tests/create"
import { pronounceTestsDeleteRoute } from "./routes/pronounce-tests/delete"
import { pronounceTestsGetRoute } from "./routes/pronounce-tests/get"
import { pronounceTestsUpdateRoute } from "./routes/pronounce-tests/update"
import { sessionTestsCreateRoute } from "./routes/session-tests/create"
import { sessionTestsDeleteRoute } from "./routes/session-tests/delete"
import { sessionTestsGetRoute } from "./routes/session-tests/get"
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

app.register(logoutRoute, {
  prefix: prefixBuilder("auth"),
})
app.register(sessionTestsCreateRoute, { prefix: API_PREFIX })
app.register(sessionTestsGetRoute, { prefix: API_PREFIX })
app.register(sessionTestsDeleteRoute, { prefix: API_PREFIX })
app.register(pronounceTestsCreateRoute, { prefix: API_PREFIX })
app.register(pronounceTestsGetRoute, { prefix: API_PREFIX })
app.register(pronounceTestsUpdateRoute, { prefix: API_PREFIX })
app.register(pronounceTestsDeleteRoute, { prefix: API_PREFIX })
