// src/routes/test-audio.ts
import { FastifyInstance } from "fastify"
import { z } from "zod"
import { transcriptionClient } from "../lib/transcription-client"
import { audioService } from "../services/audio-service"
import { env } from "../env"

export async function testAudioRoute(app: FastifyInstance) {
  // Test default audio file
  app.post(
    "/test-audio",
    {
      schema: {
        description: "Testar transcricao do arquivo DEFAULT_AUDIO_FILE",
        tags: ["Test", "Audio", "Transcription"],
        body: z
          .object({
            compareWithExpected: z.boolean().default(true),
            languageHint: z.string().optional(),
          })
          .optional(),
        response: {
          200: z.object({
            success: z.boolean(),
            testDetails: z.object({
              audioFile: z.string(),
              fileSize: z.number(),
              expectedText: z.string().optional(),
            }),
            apiStatus: z.object({
              transcriptionApiAvailable: z.boolean(),
              apiUrl: z.string(),
            }),
            transcription: z.object({
              text: z.string(),
              confidence: z.number().optional(),
              language: z.string().optional(),
              duration: z.number().optional(),
              rawResponse: z.any().optional(),
            }),
            analysis: z.object({
              hasExpectedText: z.boolean(),
              similarityScore: z.number().optional(),
              matchPercentage: z.string().optional(),
              notes: z.string().optional(),
            }),
            timing: z.object({
              totalTimeMs: z.number(),
              transcriptionTimeMs: z.number(),
            }),
            fileInfo: z
              .object({
                format: z.string(),
                sampleRate: z.number().optional(),
                channels: z.number().optional(),
              })
              .optional(),
          }),
          500: z.object({
            error: z.string(),
            message: z.string(),
            details: z.any().optional(),
          }),
          503: z.object({
            error: z.string(),
            message: z.string(),
            details: z.any().optional(),
          }),
        },
      },
    },
    async (request, reply) => {
      const startTime = Date.now()

      try {
        const body = (request.body as any) || {}
        const { compareWithExpected = true } = body

        app.log.info("Iniciando teste de transcricao do arquivo padrao")

        // 1. Check transcription API health
        const isApiAvailable = await transcriptionClient.healthCheck()
        if (!isApiAvailable) {
          app.log.warn("API de transcricao nao disponivel")
          return reply.code(503).send({
            error: "Transcription Service Unavailable",
            message: "A API de transcricao externa nao esta respondendo",
          })
        }

        // 2. Load default audio
        const { buffer: audioBuffer, info: audioInfo } =
          await audioService.getDefaultAudio()
        app.log.info(
          `Arquivo carregado: ${audioInfo.filename} (${audioBuffer.length} bytes)`
        )

        // 3. Send to transcription
        const transcriptionStart = Date.now()
        const result = await transcriptionClient.transcribeAudio(
          audioBuffer,
          audioInfo.filename
        )
        const transcriptionTime = Date.now() - transcriptionStart

        // 4. Analyze
        let analysis: {
          hasExpectedText: boolean
          similarityScore?: number
          matchPercentage?: string
          notes?: string
        } = { hasExpectedText: false }

        if (compareWithExpected && audioInfo.expectedText) {
          const similarity = calculateSimilarityScore(
            audioInfo.expectedText,
            result.text
          )
          analysis = {
            hasExpectedText: true,
            similarityScore: similarity,
            matchPercentage: `${(similarity * 100).toFixed(1)}%`,
            notes: getSimilarityNotes(similarity),
          }
        }

        const totalTime = Date.now() - startTime

        return reply.code(200).send({
          success: true,
          testDetails: {
            audioFile: audioInfo.filename,
            fileSize: audioBuffer.length,
            expectedText: audioInfo.expectedText,
          },
          apiStatus: {
            transcriptionApiAvailable: isApiAvailable,
            apiUrl: env.TRANSCRIPTION_API_URL,
          },
          transcription: {
            text: result.text,
            confidence: result.confidence,
            language: result.language,
            duration: result.duration,
            rawResponse: result,
          },
          analysis,
          timing: {
            totalTimeMs: totalTime,
            transcriptionTimeMs: transcriptionTime,
          },
          fileInfo: analyzeAudioFile(audioBuffer, audioInfo.filename),
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
        app.log.error("Erro no teste de audio:", error)

        return reply.code(500).send({
          error: "Audio Test Failed",
          message: errorMessage,
          details:
            process.env.NODE_ENV === "development"
              ? { stack: error instanceof Error ? error.stack : undefined }
              : undefined,
        })
      }
    }
  )

  // Info route
  app.get(
    "/test-audio/info",
    {
      schema: {
        description: "Obter informacoes do arquivo de audio de teste",
        tags: ["Test", "Audio"],
        response: {
          200: z.object({
            success: z.boolean(),
            audioFile: z.object({
              filename: z.string(),
              path: z.string(),
              size: z.number(),
              exists: z.boolean(),
              format: z.string(),
              expectedText: z.string().optional(),
            }),
            availableAudios: z.array(
              z.object({
                filename: z.string(),
                size: z.number(),
              })
            ),
          }),
        },
      },
    },
    async () => {
      const { info: audioInfo } = await audioService.getDefaultAudio()
      const allAudios = await audioService.getAvailableAudios()

      return {
        success: true,
        audioFile: {
          filename: audioInfo.filename,
          path: audioInfo.path,
          size: audioInfo.size,
          exists: true,
          format: audioInfo.filename.split(".").pop() || "unknown",
          expectedText: audioInfo.expectedText,
        },
        availableAudios: allAudios.map((a) => ({
          filename: a.filename,
          size: a.size,
        })),
      }
    }
  )

  // Custom upload route (multipart)
  app.post(
    "/test-audio/upload",
    {
      schema: {
        description: "Testar transcricao com upload de arquivo personalizado",
        tags: ["Test", "Audio", "Transcription"],
        consumes: ["multipart/form-data"],
        body: z.any(), // let fastify-multipart handle parsing
        response: {
          200: z.object({
            success: z.boolean(),
            filename: z.string(),
            fileSize: z.number(),
            transcription: z.object({
              text: z.string(),
              confidence: z.number().optional(),
              language: z.string().optional(),
            }),
            comparison: z
              .object({
                expectedText: z.string().optional(),
                similarity: z.number().optional(),
                match: z.string().optional(),
              })
              .optional(),
          }),
          400: z.object({
            error: z.string(),
            message: z.string(),
          }),
          500: z.object({
            error: z.string(),
            message: z.string(),
            details: z.any().optional(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const data = await (request as any).file()
        if (!data) {
          return reply.code(400).send({
            error: "No audio file provided",
            message: "Please upload an audio file",
          })
        }

        const audioBuffer = await data.toBuffer()
        const expectedText = (request.body as any)?.expectedText

        app.log.info(`Enviando arquivo ${data.filename} para transcricao...`)

        const result = await transcriptionClient.transcribeAudio(
          audioBuffer,
          data.filename
        )

        let comparison:
          | {
              expectedText?: string
              similarity?: number
              match?: string
            }
          | undefined

        if (expectedText) {
          const similarity = calculateSimilarityScore(expectedText, result.text)
          comparison = {
            expectedText,
            similarity,
            match: `${(similarity * 100).toFixed(1)}%`,
          }
        }

        return reply.code(200).send({
          success: true,
          filename: data.filename,
          fileSize: audioBuffer.length,
          transcription: {
            text: result.text,
            confidence: result.confidence,
            language: result.language,
          },
          comparison,
        })
      } catch (error) {
        app.log.error("Upload test error:", error)
        return reply.code(500).send({
          error: "Upload test failed",
          message: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }
  )
}

// Helpers
function calculateSimilarityScore(expected: string, actual: string): number {
  if (!expected || !actual) return 0

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()

  const expNorm = normalize(expected)
  const actNorm = normalize(actual)
  if (expNorm === actNorm) return 1.0

  const expWords = new Set(expNorm.split(" "))
  const actWords = actNorm.split(" ")

  let matches = 0
  for (const word of actWords) {
    if (expWords.has(word)) {
      matches++
    }
  }

  const precision = matches / actWords.length
  const recall = matches / expWords.size
  return (precision + recall) / 2
}

function getSimilarityNotes(score: number): string {
  if (score >= 0.9) return "Transcricao excelente"
  if (score >= 0.7) return "Boa transcricao"
  if (score >= 0.5) return "Transcricao moderada"
  if (score >= 0.3) return "Transcricao basica"
  return "Baixa correspondencia"
}

function analyzeAudioFile(buffer: Buffer, filename: string) {
  const format = filename.split(".").pop()?.toUpperCase() || "UNKNOWN"
  const info: any = { format }

  if (format === "OGG" || format === "WAV") {
    info.estimatedDuration = Math.floor(buffer.length / 16000)
    info.notes =
      "Analise basica - considere usar biblioteca especializada para metadados"
  }

  return info
}
