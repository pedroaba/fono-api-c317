import { hash } from "argon2"
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod"
import { z } from "zod"
import { STATUS_CODE } from "@/constants/status-code"
import {
  MINIMUM_NAME_LENGTH,
  MINIMUM_PASSWORD_LENGTH,
} from "@/constants/validation"
import { prisma } from "@/lib/prisma"

export const createUserRoute: FastifyPluginAsyncZod = async (server) => {
  await server.post(
    "/",
    {
      schema: {
        tags: ["user"],
        summary: "Create a new user account",
        description:
          "Creates a new user account with email, password, and name. The email must be unique and the password must be at least 8 characters long.",
        body: z.object({
          email: z
            .email("Formato de email inválido")
            .describe("User's email address (must be unique)")
            .meta({
              example: "user@example.com",
            }),
          password: z
            .string({ error: "Senha é obrigatória" })
            .min(
              MINIMUM_PASSWORD_LENGTH,
              "Senha deve ter pelo menos 8 caracteres"
            )
            .describe("User's password (minimum 8 characters)")
            .meta({
              example: "password123",
            }),
          name: z
            .string({ error: "Nome é obrigatório" })
            .min(MINIMUM_NAME_LENGTH, "Nome não pode estar vazio")
            .describe("User's full name")
            .meta({
              example: "John Doe",
            }),
        }),
        response: {
          201: z
            .object({
              id: z.string().describe("User's id"),
            })
            .meta({
              example: "cm123abc456def789",
            })
            .describe("User account created successfully"),
          400: z
            .object({
              error: z.string().describe("Validation error message"),
            })
            .describe("Bad request - invalid input data"),
          409: z
            .object({
              error: z.string().describe("Conflict error message"),
            })
            .describe("Conflict - email already exists"),
        },
      },
    },
    async (request, reply) => {
      const { email, password, name } = request.body

      const userOnDb = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (userOnDb) {
        return reply.status(STATUS_CODE.CONFLICT).send({
          error: "Email já cadastrado",
        })
      }

      const hashedPassword = await hash(password)
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name },
      })

      return {
        id: user.id,
      }
    }
  )
}
