// src/lib/transcription-client.ts
import { env } from "../env"

export interface TranscriptionResult {
  text: string
  language?: string
  confidence?: number
  duration?: number
  segments?: Array<{
    start: number
    end: number
    text: string
    confidence: number
  }>
}

export class TranscriptionClient {
  private baseUrl: string
  private apiKey?: string

  constructor() {
    this.baseUrl = env.TRANSCRIPTION_API_URL
    this.apiKey = env.TRANSCRIPTION_API_KEY
  }

  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<TranscriptionResult> {
    try {
      const mimeType = this.getMimeType(filename)

      // ✅ USAR FormData NATIVO DO NODE
      const formData = new FormData()

      // ✅ USAR BLOB NATIVO (ISSO QUE O FASTAPI ENTENDE DIREITO)
      const uint8Array = new Uint8Array(audioBuffer)
      const blob = new Blob([uint8Array], { type: mimeType })

      // ⚠️ NOME DO CAMPO PRECISA SER "file"
      formData.append("file", blob, filename)

      const headers: Record<string, string> = {
        Accept: "application/json",
      }

      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`
      }

      console.log(`📤 Enviando arquivo ${filename} (${audioBuffer.length} bytes) para transcrição...`)
      console.log(`🎯 Endpoint: ${this.baseUrl}`)

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers,
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Transcription API error ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      console.log(`✅ Transcrição recebida: "${data.text?.substring(0, 50)}..."`)

      return {
        text: data.text || "",
        language: data.language,
        confidence: data.confidence,
        duration: data.duration,
        segments: data.segments,
      }

    } catch (error) {
      console.error("❌ Transcription API call failed:", error)
      throw new Error(
        `Failed to transcribe audio: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const baseUrl = this.baseUrl.replace("/transcribe/file", "")
      const healthUrl = `${baseUrl}/health`

      console.log(`🔍 Verificando saúde da API em: ${healthUrl}`)

      const response = await fetch(healthUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        console.warn(`⚠️  Health check failed with status: ${response.status}`)
        return false
      }

      const data = await response.json()
      const isHealthy = data.status === "healthy"

      console.log(isHealthy ? "✅ API saudável" : "⚠️  API reportou problemas")
      return isHealthy

    } catch (error) {
      console.error("❌ Health check failed:", error)
      return false
    }
  }

  private getMimeType(filename: string): string {
    const extension = filename.toLowerCase().split(".").pop() || ""

    const mimeTypes: Record<string, string> = {
      wav: "audio/wav",
      mp3: "audio/mpeg",
      m4a: "audio/mp4",
      ogg: "audio/ogg",
      flac: "audio/flac",
      webm: "audio/webm",
    }

    return mimeTypes[extension] || "audio/wav"
  }
}

export const transcriptionClient = new TranscriptionClient()
