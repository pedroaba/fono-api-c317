// src/routes/test-audio.ts
import {FastifyInstance} from "fastify"
import {z} from "zod"
import {transcriptionClient} from "../lib/transcription-client"
import {audioService} from "../services/audio-service"
import {env} from "../env"

export async function testAudioRoute(app: FastifyInstance) {
    // Rota principal para testar seu arquivo teste.ogg
    app.post("/test-audio", {
        schema: {
            description: "Testar transcrição do arquivo teste.ogg",
            tags: ["Test", "Audio", "Transcription"],
            body: z.object({
                // Parâmetros opcionais para o teste
                compareWithExpected: z.boolean().default(true),
                languageHint: z.string().optional(),
            }).optional(),
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
                    fileInfo: z.object({
                        format: z.string(),
                        sampleRate: z.number().optional(),
                        channels: z.number().optional(),
                    }).optional(),
                }),
                // admita também 500 e 503 (usados no código)
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
    }, async (request, reply) => {
        const startTime = Date.now()

        try {
            const body = (request.body as any) || {}
            const {compareWithExpected = true, languageHint} = body

            app.log.info("🎵 Iniciando teste de transcrição do arquivo teste.ogg")

            // 1. Verificar status da API de transcrição
            app.log.info("🔍 Verificando API de transcrição...")
            const isApiAvailable = await transcriptionClient.healthCheck()

            if (!isApiAvailable) {
                app.log.warn("⚠️ API de transcrição não disponível")
                return reply.code(503).send({
                    error: "Transcription Service Unavailable",
                    message: "A API de transcrição externa não está respondendo",
                })
            }

            // 2. Carregar o arquivo de áudio
            app.log.info(`📂 Carregando arquivo: ${env.DEFAULT_AUDIO_FILE}`)
            const {buffer: audioBuffer, info: audioInfo} = await audioService.getDefaultAudio()

            app.log.info(`✅ Arquivo carregado: ${audioInfo.filename} (${audioBuffer.length} bytes)`)

            // 3. Enviar para transcrição
            app.log.info("📤 Enviando áudio para transcrição...")
            const transcriptionStart = Date.now()

            const result = await transcriptionClient.transcribeAudio(
                audioBuffer,
                audioInfo.filename
            )

            const transcriptionTime = Date.now() - transcriptionStart
            app.log.info(`✅ Transcrição recebida em ${transcriptionTime}ms`)

            // 4. Analisar resultado
            let analysis = {
                hasExpectedText: false,
                similarityScore: undefined as number | undefined,
                matchPercentage: undefined as string | undefined,
                notes: "Transcrição realizada com sucesso",
            }

            if (compareWithExpected && audioInfo.expectedText) {
                const similarity = calculateSimilarityScore(audioInfo.expectedText, result.text)
                analysis = {
                    hasExpectedText: true,
                    similarityScore: similarity,
                    matchPercentage: `${(similarity * 100).toFixed(1)}%`,
                    notes: getSimilarityNotes(similarity),
                }

                app.log.info(`📊 Similaridade com texto esperado: ${analysis.matchPercentage}`)
            }

            // 5. Analisar metadados do arquivo
            const fileInfo = analyzeAudioFile(audioBuffer, audioInfo.filename)

            // 6. Montar resposta completa
            const totalTime = Date.now() - startTime

            const payload = {
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
                    rawResponse: result, // Inclui toda resposta da API
                },
                analysis,
                timing: {
                    totalTimeMs: totalTime,
                    transcriptionTimeMs: transcriptionTime,
                },
                fileInfo,
            }

            app.log.info(`🎉 Teste completo em ${totalTime}ms`)

            return reply.code(200).send(payload)

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
            app.log.error("❌ Erro no teste de áudio:", error)

            return reply.code(500).send({
                error: "Audio Test Failed",
                message: errorMessage,
                details: process.env.NODE_ENV === 'development' ?
                    {stack: error instanceof Error ? error.stack : undefined} :
                    undefined,
            })
        }
    })

    // Rota para visualizar informações do arquivo
    app.get("/test-audio/info", {
        schema: {
            description: "Obter informações do arquivo de áudio de teste",
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
                    availableAudios: z.array(z.object({
                        filename: z.string(),
                        size: z.number(),
                    })),
                }),
            },
        },
    }, async () => {
        const {info: audioInfo} = await audioService.getDefaultAudio()
        const allAudios = await audioService.getAvailableAudios()

        return {
            success: true,
            audioFile: {
                filename: audioInfo.filename,
                path: audioInfo.path,
                size: audioInfo.size,
                exists: true, // Assumindo que existe
                format: audioInfo.filename.split('.').pop() || 'unknown',
                expectedText: audioInfo.expectedText,
            },
            availableAudios: allAudios.map(a => ({
                filename: a.filename,
                size: a.size,
            })),
        }
    })

    // Rota para testar upload de áudio personalizado
    app.post("/test-audio/upload", {
        schema: {
            description: "Testar transcrição com upload de arquivo personalizado",
            tags: ["Test", "Audio", "Transcription"],
            consumes: ["multipart/form-data"],
            body: {
                type: "object",
                properties: {
                    audio: {
                        type: "string",
                        format: "binary",
                        description: "Arquivo de áudio para teste",
                    },
                    expectedText: {
                        type: "string",
                        description: "Texto esperado (para comparação)",
                        required: false,
                    },
                },
            },
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
                    comparison: z.object({
                        expectedText: z.string().optional(),
                        similarity: z.number().optional(),
                        match: z.string().optional(),
                    }).optional(),
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
    }, async (request, reply) => {
        try {
            // cast pra any porque as typings do multipart às vezes não estão presentes
            const data = await (request as any).file()

            if (!data) {
                return reply.code(400).send({
                    error: "No audio file provided",
                    message: "Please upload an audio file",
                })
            }

            const audioBuffer = await data.toBuffer()
            const body = request.body as any
            const expectedText = body?.expectedText

            app.log.info(`📤 Enviando arquivo ${data.filename} para transcrição...`)

            const result = await transcriptionClient.transcribeAudio(
                audioBuffer,
                data.filename
            )

            let comparison = undefined
            if (expectedText) {
                const similarity = calculateSimilarityScore(expectedText, result.text)
                let comparison:
                    | {
                    expectedText?: string
                    similarity?: number
                    match?: string
                }
                    | undefined

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
    })
}

// Funções auxiliares
function calculateSimilarityScore(expected: string, actual: string): number {
    if (!expected || !actual) return 0

    // Normalização
    const normalize = (text: string) =>
        text.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^\w\s]/g, '') // Remove pontuação
            .replace(/\s+/g, ' ')    // Normaliza espaços
            .trim()

    const expNorm = normalize(expected)
    const actNorm = normalize(actual)

    if (expNorm === actNorm) return 1.0

    // Divide em palavras
    const expWords = new Set(expNorm.split(' '))
    const actWords = actNorm.split(' ')

    // Conta palavras correspondentes
    let matches = 0
    for (const word of actWords) {
        if (expWords.has(word)) {
            matches++
        }
    }

    // Calcula score (média entre precisão e recall)
    const precision = matches / actWords.length
    const recall = matches / expWords.size

    return (precision + recall) / 2
}

function getSimilarityNotes(score: number): string {
    if (score >= 0.9) return "Transcrição excelente, quase perfeita"
    if (score >= 0.7) return "Boa transcrição, algumas diferenças pequenas"
    if (score >= 0.5) return "Transcrição moderada, conteúdo principal identificado"
    if (score >= 0.3) return "Transcrição básica, algumas palavras identificadas"
    return "Baixa correspondência, pode haver erro na transcrição"
}

function analyzeAudioFile(buffer: Buffer, filename: string) {
    const format = filename.split('.').pop()?.toUpperCase() || 'UNKNOWN'

    // Análise básica baseada no formato
    const info: any = {format}

    if (format === 'OGG' || format === 'WAV') {
        // Tentativa básica de análise (em produção use uma biblioteca como 'music-metadata')
        info.estimatedDuration = Math.floor(buffer.length / 16000) // Estimativa grosseira
        info.notes = "Análise básica - considere usar biblioteca especializada para metadados"
    }

    return info
}
