// plugins/request-methods.ts

import type { FastifyRequest } from "fastify"
import fp from "fastify-plugin"
import { prisma } from "@/lib/prisma"

export const getSessionPlugin = fp((fastify, _opts, done) => {
  fastify.decorateRequest("getSession", async (request: FastifyRequest) => {
    const sessionId = request.cookies.session

    if (!sessionId) {
      return { session: null }
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    })

    if (!session || session.invalidatedAt) {
      return {
        session: null,
      }
    }

    return { session }
  })

  fastify.decorateRequest("getLoggedUser", async (request: FastifyRequest) => {
    const { session } = await request.getSession(request)

    if (!session) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })

    return user
  })

  done()
})
