// biome-ignore lint/performance/noNamespaceImport: <dayjs>
import * as dayjs from "dayjs"
import type { FastifyReply, FastifyRequest } from "fastify"
import { STATUS_CODE } from "@/constants/status-code"
import { prisma } from "@/lib/prisma"

export async function auth(request: FastifyRequest, reply: FastifyReply) {
  const session = request.cookies.session

  if (!session) {
    return reply.status(STATUS_CODE.UNAUTHORIZED).send()
  }

  const sessionOnDb = await prisma.session.findUnique({
    where: { id: session },
  })

  if (!sessionOnDb || sessionOnDb.invalidatedAt) {
    return reply.status(STATUS_CODE.UNAUTHORIZED).send()
  }

  const isExpired = dayjs().diff(sessionOnDb.createdAt, "day") >= 2
  if (isExpired) {
    return reply.status(STATUS_CODE.UNAUTHORIZED).send()
  }
}
