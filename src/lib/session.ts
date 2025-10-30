import { randomBytes } from "node:crypto"
import { prisma } from "./prisma"

const TOKEN_LENGTH = 32

export const Session = {
  token() {
    const prefix = process.env.NODE_ENV === "production" ? "fono" : "dev"
    const token = randomBytes(TOKEN_LENGTH)

    return `${prefix}:${token.toString("hex")}`
  },

  async invalidateOlderSessions(userId: string) {
    try {
      await prisma.session.updateMany({
        where: {
          userId,
          invalidatedAt: null,
        },
        data: {
          invalidatedAt: new Date(),
        },
      })
    } finally {
      // do nothing
    }
  },
}
