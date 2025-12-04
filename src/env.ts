import crypto from "node:crypto"
import "dotenv/config"
import { z } from "zod"

const DEFAULT_PORT = 3000

const envSchema = z.object({
  PORT: z.coerce.number().default(DEFAULT_PORT),
  DATABASE_URL: z.string({ error: "DATABASE_URL is required" }),
  SECRET_KEY: z.string({ error: "SECRET_KEY is required" }),
})

const isSecretMissing =
  !process.env.SECRET_KEY || process.env.SECRET_KEY.trim().length === 0

const envVars = {
  ...process.env,
  SECRET_KEY: isSecretMissing
    ? crypto.randomBytes(32).toString("hex")
    : process.env.SECRET_KEY,
}

export const env = envSchema.parse(envVars)

if (isSecretMissing) {
  console.warn(
    "SECRET_KEY was not provided. Generated an ephemeral key for this process.",
  )
}
