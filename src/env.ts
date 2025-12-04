// src/env.ts
import crypto from "node:crypto"
import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string({ error: "DATABASE_URL is required" }),
    SECRET_KEY: z.string({ error: "SECRET_KEY is required" }),
    
    // API de Transcrição Externa (REAL)
    TRANSCRIPTION_API_URL: z.string().url().default("http://localhost:8000/api/v1/transcribe/file"),
    TRANSCRIPTION_API_KEY: z.string().optional(),
    
    TEST_AUDIO_PATH: z.string().default("assets/audios"),

    // Seu arquivo de áudio
    DEFAULT_AUDIO_FILE: z.string().default("teste.ogg"),

    // Texto esperado para seu áudio (você vai definir isso)
    EXPECTED_TRANSCRIPTION: z.string().default("Teste de transcrição"),
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
