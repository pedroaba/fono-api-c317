import { FastifyInstance } from "fastify"
import { z } from "zod"
import { transcriptionClient } from "../lib/transcription-client"
import { audioService } from "../services/audio-service"

export async function transcriptionTestRoute(app: FastifyInstance) {

  // ================================
  // ROTA 1 — ÁUDIO PADRÃO
  // ================================
  app.post("/transcription-test/default", {
    schema: {
      description: "Teste de transcrição usando áudio padrão",
      tags: ["Test", "Transcription"],
      response: {
        200: z.object({
          success: z.boolean(),
          testType: z.string(),
          audioInfo: z.object({
            filename: z.string(),
            size: z.number(),
            expectedText: z.string().optional(),
          }),
          transcription: z.object({
            text: z.string(),
            confidence: z.number().optional(),
            language: z.string().optional(),
            duration: z.number().optional(),
          }),
          analysis: z.object({
            hasExpectedText: z.boolean(),
            similarityScore: z.number().optional(),
            matchPercentage: z.string().optional(),
          }),
          timing: z.object({
            totalTime: z.number(),
            transcriptionTime: z.number(),
          }),
        }),
        500: z.object({
          error: z.string(),
          message: z.string(),
        }),
        503: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const startTime = Date.now()

      const isApiAvailable = await transcriptionClient.healthCheck()
      if (!isApiAvailable) {
        return reply.code(503).send({
          error: "Service Unavailable",
          message: "Transcription API is not available",
        })
      }

      const { buffer: audioBuffer, info: audioInfo } = await audioService.getDefaultAudio()

      const transcriptionStart = Date.now()
      const result = await transcriptionClient.transcribeAudio(audioBuffer, audioInfo.filename)
      const transcriptionTime = Date.now() - transcriptionStart

      let analysis: {
        hasExpectedText: boolean
        similarityScore?: number
        matchPercentage?: string
      } = {
        hasExpectedText: false,
      }

      if (audioInfo.expectedText) {
        const similarity = calculateSimilarity(audioInfo.expectedText, result.text)
        analysis = {
          hasExpectedText: true,
          similarityScore: similarity,
          matchPercentage: `${(similarity * 100).toFixed(1)}%`,
        }
      }

      const totalTime = Date.now() - startTime

      return {
        success: true,
        testType: "default-audio-transcription-test",
        audioInfo: {
          filename: audioInfo.filename,
          size: audioInfo.size,
          expectedText: audioInfo.expectedText,
        },
        transcription: {
          text: result.text,
          confidence: result.confidence,
          language: result.language,
          duration: result.duration,
        },
        analysis,
        timing: {
          totalTime,
          transcriptionTime,
        },
      }

    } catch (error) {
      return reply.code(500).send({
        error: "Transcription test failed",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  })


  // ================================
  // ROTA 2 — LISTAR ÁUDIOS
  // ================================
  app.get("/transcription-test/audios", {
    schema: {
      response: {
        200: z.object({
          success: z.boolean(),
          count: z.number(),
          audios: z.array(z.object({
            filename: z.string(),
            size: z.number(),
            language: z.string().optional(),
            expectedText: z.string().optional(),
          })),
        }),
      },
    },
  }, async () => {
    const audios = await audioService.getAvailableAudios()

    return {
      success: true,
      count: audios.length,
      audios,
    }
  })


  // ================================
  // ROTA 3 — ÁUDIO ESPECÍFICO
  // ================================
  app.post("/transcription-test/audio/:filename", {
    schema: {
      params: z.object({
        filename: z.string(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          filename: z.string(),
          transcription: z.object({
            text: z.string(),
            confidence: z.number().optional(),
            language: z.string().optional(),
          }),
          expectedText: z.string().optional(),
          similarity: z.object({
            score: z.number(),
            percentage: z.string(),
            interpretation: z.string(),
          }).optional(),
        }),
        404: z.object({
          error: z.string(),
          message: z.string(),
        }),
        500: z.object({
          error: z.string(),
          message: z.string(),
        }),
        503: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const { filename } = request.params as { filename: string }

      const isApiAvailable = await transcriptionClient.healthCheck()
      if (!isApiAvailable) {
        return reply.code(503).send({
          error: "Service Unavailable",
          message: "Transcription API is not available",
        })
      }

      const audioBuffer = await audioService.getAudioBuffer(filename)
      const audios = await audioService.getAvailableAudios()
      const audioInfo = audios.find(a => a.filename === filename)

      if (!audioInfo) {
        return reply.code(404).send({
          error: "Audio not found",
          message: `Audio file ${filename} not found`,
        })
      }

      const result = await transcriptionClient.transcribeAudio(audioBuffer, filename)

      let similarity:
        | {
            score: number
            percentage: string
            interpretation: string
          }
        | undefined

      if (audioInfo.expectedText) {
        const score = calculateSimilarity(audioInfo.expectedText, result.text)
        similarity = {
          score,
          percentage: `${(score * 100).toFixed(1)}%`,
          interpretation: getSimilarityInterpretation(score),
        }
      }

      return {
        success: true,
        filename,
        transcription: {
          text: result.text,
          confidence: result.confidence,
          language: result.language,
        },
        expectedText: audioInfo.expectedText,
        similarity,
      }

    } catch (error) {
      return reply.code(500).send({
        error: "Transcription test failed",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  })


  // ================================
  // ROTA 4 — BATCH
  // ================================
  app.post("/transcription-test/batch", {
    schema: {
      response: {
        200: z.object({
          success: z.boolean(),
          totalTests: z.number(),
          successful: z.number(),
          failed: z.number(),
          results: z.array(z.object({
            filename: z.string(),
            success: z.boolean(),
            transcription: z.string().optional(),
            expectedText: z.string().optional(),
            similarity: z.number().optional(),
            error: z.string().optional(),
          })),
          summary: z.object({
            averageSimilarity: z.number(),
            bestMatch: z.string().optional(),
            worstMatch: z.string().optional(),
          }).optional(),
        }),
        500: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const audios = await audioService.getAvailableAudios()

      const results: Array<{
        filename: string
        success: boolean
        transcription?: string
        expectedText?: string
        similarity?: number
        error?: string
      }> = []

      let successful = 0
      let failed = 0
      const similarityScores: number[] = []

      for (const audio of audios) {
        try {
          const audioBuffer = await audioService.getAudioBuffer(audio.filename)
          const result = await transcriptionClient.transcribeAudio(audioBuffer, audio.filename)

          let similarity: number | undefined

          if (audio.expectedText) {
            similarity = calculateSimilarity(audio.expectedText, result.text)
            similarityScores.push(similarity)
          }

          results.push({
            filename: audio.filename,
            success: true,
            transcription: result.text,
            expectedText: audio.expectedText,
            similarity,
          })

          successful++
        } catch (error) {
          results.push({
            filename: audio.filename,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          })
          failed++
        }
      }

      let summary:
        | {
            averageSimilarity: number
            bestMatch?: string
            worstMatch?: string
          }
        | undefined

      if (similarityScores.length > 0) {
        const average = similarityScores.reduce((a, b) => a + b, 0) / similarityScores.length

        summary = {
          averageSimilarity: average,
          bestMatch: results.find(r => r.similarity === Math.max(...similarityScores))?.filename,
          worstMatch: results.find(r => r.similarity === Math.min(...similarityScores))?.filename,
        }
      }

      return {
        success: true,
        totalTests: audios.length,
        successful,
        failed,
        results,
        summary,
      }

    } catch (error) {
      return reply.code(500).send({
        error: "Batch test failed",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  })
}


// ================================
// FUNÇÕES AUXILIARES
// ================================
function calculateSimilarity(expected: string, actual: string): number {
  const normalize = (str: string) =>
    str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

  const exp = normalize(expected)
  const act = normalize(actual)

  if (exp === act) return 1.0

  const expWords = exp.split(' ')
  const actWords = act.split(' ')

  let matches = 0
  for (const word of expWords) {
    if (actWords.includes(word)) matches++
  }

  return matches / Math.max(expWords.length, 1)
}

function getSimilarityInterpretation(score: number): string {
  if (score >= 0.9) return "Excelente correspondência"
  if (score >= 0.7) return "Boa correspondência"
  if (score >= 0.5) return "Correspondência moderada"
  if (score >= 0.3) return "Baixa correspondência"
  return "Correspondência muito baixa"
}
