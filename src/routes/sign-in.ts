import { verify } from "argon2"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import z from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import { MINIMUM_PASSWORD_LENGTH } from "@/constants/validation"
import { prisma } from "@/lib/prisma"
import { Session } from "@/lib/session"

const SESSION_MAX_AGE = 60 * 60 * 24 * 2

export const signInRoute: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/sign-in",
    {
      schema: {
        tags: ["auth"],
        summary: "User authentication",
        description:
          "Authenticates a user with email and password credentials. Returns authentication status and user information upon successful login.",
        body: z.object({
          email: z
            .email({
              error: "Formato de email inválido",
            })
            .describe("User's email address for authentication")
            .meta({
              example: "user@example.com",
            }),
          password: z
            .string({ error: "Senha é obrigatória" })
            .min(MINIMUM_PASSWORD_LENGTH, {
              error: "Senha deve ter pelo menos 8 caracteres",
            })
            .describe("User's password for authentication")
            .meta({
              example: "password123",
            }),
        }),
        response: {
          200: z.void().describe("Login successful"),
          400: z.void().describe("Bad request - invalid input data"),
          401: z.void().describe("Unauthorized - invalid credentials"),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        return reply.status(STATUS_CODE.UNAUTHORIZED).send()
      }

      const isPasswordsMatch = await verify(user.password, password)

      if (!isPasswordsMatch) {
        return reply.status(STATUS_CODE.UNAUTHORIZED).send()
      }

      await Session.invalidateOlderSessions(user.id)

      const session = await prisma.session.create({
        data: {
          id: Session.token(),
          userId: user.id,
        },
      })

      return reply
        .cookie("session", session.id, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: SESSION_MAX_AGE,
          expires: new Date(Date.now() + SESSION_MAX_AGE),
          domain: "localhost",
        })
        .status(STATUS_CODE.OK)
        .send()
    }
  )
}
