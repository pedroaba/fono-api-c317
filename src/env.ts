import "dotenv/config"
import { z } from "zod"

const DEFAULT_PORT = 3000

const envSchema = z.object({
  PORT: z.number().default(DEFAULT_PORT),
  DATABASE_URL: z.string({ error: "DATABASE_URL is required" }),
})

export const env = envSchema.parse(process.env)
