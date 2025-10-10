/** biome-ignore-all lint/nursery/useConsistentTypeDefinitions: <fastify> */
import type { Session, User } from "@prisma/client"
import "fastify"

declare module "fastify" {
  interface FastifyRequest {
    getSession(request: FastifyRequest): Promise<{ session: Session | null }>
    getLoggedUser(request: FastifyRequest): Promise<User | null>
  }
}
