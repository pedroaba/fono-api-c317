import { API_PREFIX, prefixBuilder } from "@/constants/common"
import { createPronounceRoute } from "@/routes/pronouces/create"
import { deletePronounceRoute } from "@/routes/pronouces/delete"
import { getPronouncesRoute } from "@/routes/pronouces/get"
import { pronounceTestsCreateRoute } from "@/routes/pronounce-tests/create"
import { pronounceTestsDeleteRoute } from "@/routes/pronounce-tests/delete"
import { pronounceTestsGetRoute } from "@/routes/pronounce-tests/get"
import { pronounceTestsUpdateRoute } from "@/routes/pronounce-tests/update"
import { sessionTestsCreateRoute } from "@/routes/session-tests/create"
import { sessionTestsDeleteRoute } from "@/routes/session-tests/delete"
import { sessionTestsGetRoute } from "@/routes/session-tests/get"
import type { FastifyInstance } from "fastify"

export async function registerPronounceTestRoutes(server: FastifyInstance) {
  await server.register(pronounceTestsCreateRoute, { prefix: API_PREFIX })
  await server.register(pronounceTestsGetRoute, { prefix: API_PREFIX })
  await server.register(pronounceTestsUpdateRoute, { prefix: API_PREFIX })
  await server.register(pronounceTestsDeleteRoute, { prefix: API_PREFIX })
}

export async function registerSessionTestRoutes(server: FastifyInstance) {
  await server.register(sessionTestsCreateRoute, { prefix: API_PREFIX })
  await server.register(sessionTestsGetRoute, { prefix: API_PREFIX })
  await server.register(sessionTestsDeleteRoute, { prefix: API_PREFIX })
}

export async function registerPronouncesRoutes(server: FastifyInstance) {
  const prefix = prefixBuilder("pronounces")
  await server.register(createPronounceRoute, { prefix })
  await server.register(getPronouncesRoute, { prefix })
  await server.register(deletePronounceRoute, { prefix })
}

