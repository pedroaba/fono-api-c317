// src/services/audio-service.ts
import fs from "fs/promises"
import path from "path"
import { env } from "../env"

export interface AudioFile {
  filename: string
  path: string
  size: number
  duration?: number
  language?: string
  expectedText?: string
  description?: string
}

export class AudioService {
  private audioPath: string

  constructor() {
    // Corrige o caminho para ser absoluto
    this.audioPath = path.resolve(process.cwd(), "src/assets/audios")
    console.log(`🔍 Procurando áudios em: ${this.audioPath}`)
  }

  async initialize(): Promise<void> {
    try {
      // Cria o diretório se não existir
      await fs.mkdir(this.audioPath, { recursive: true })
      console.log(`✅ Diretório de áudios: ${this.audioPath}`)
    } catch (error) {
      console.error("❌ Erro ao criar diretório:", error)
    }
  }

  async getAvailableAudios(): Promise<AudioFile[]> {
    try {
      await this.initialize()

      const files = await fs.readdir(this.audioPath)
      console.log(`📁 Arquivos encontrados: ${files.join(", ")}`)

      const audioFiles: AudioFile[] = []

      for (const filename of files) {
        if (this.isAudioFile(filename)) {
          const filePath = path.join(this.audioPath, filename)
          const stats = await fs.stat(filePath)

          audioFiles.push(this.createAudioInfo(filename, filePath, stats.size))
          console.log(`✅ Áudio detectado: ${filename} (${(stats.size / 1024).toFixed(1)} KB)`)
        }
      }

      // Se não encontrar arquivos, tenta usar o arquivo do diretório raiz
      if (audioFiles.length === 0) {
        console.log("⚠️  Nenhum áudio encontrado, verificando diretório raiz...")
        const rootAudio = await this.checkRootAudio()
        if (rootAudio) {
          audioFiles.push(rootAudio)
        }
      }

      return audioFiles
    } catch (error: any) {
      console.error("❌ Erro ao ler diretório de áudios:", error.message)
      // Tenta usar o arquivo do diretório raiz como fallback
      const rootAudio = await this.checkRootAudio()
      return rootAudio ? [rootAudio] : []
    }
  }

  async getAudioBuffer(filename: string): Promise<Buffer> {
    console.log(`🔍 Buscando arquivo: ${filename}`)

    // Primeiro tenta no diretório de áudios
    let filePath = path.join(this.audioPath, filename)

    try {
      await fs.access(filePath)
      console.log(`✅ Arquivo encontrado em: ${filePath}`)
    } catch (error) {
      // Se não encontrar, tenta no diretório raiz do projeto
      console.log(`⚠️  Arquivo não encontrado em ${filePath}, tentando diretório raiz...`)
      filePath = path.resolve(process.cwd(), filename)

      try {
        await fs.access(filePath)
        console.log(`✅ Arquivo encontrado em: ${filePath}`)
      } catch (error2) {
        // Última tentativa: diretório audio/
        console.log("⚠️  Tentando diretório audio/...")
        filePath = path.resolve(process.cwd(), "audio", filename)

        try {
          await fs.access(filePath)
          console.log(`✅ Arquivo encontrado em: ${filePath}`)
        } catch (error3) {
          console.error(`❌ Arquivo ${filename} não encontrado em nenhum local`)
          throw new Error(`Audio file not found: ${filename}. Procurado em:
          1. ${path.join(this.audioPath, filename)}
          2. ${path.resolve(process.cwd(), filename)}
          3. ${path.resolve(process.cwd(), "audio", filename)}`)
        }
      }
    }

    const buffer = await fs.readFile(filePath)
    console.log(`📦 Arquivo carregado: ${filename} (${buffer.length} bytes)`)

    return buffer
  }

  async getDefaultAudio(): Promise<{ buffer: Buffer; info: AudioFile }> {
    const defaultFile = env.DEFAULT_AUDIO_FILE

    try {
      console.log(`🎵 Carregando áudio padrão: ${defaultFile}`)
      const buffer = await this.getAudioBuffer(defaultFile)
      const files = await this.getAvailableAudios()

      let info = files.find(f => f.filename === defaultFile)
      if (!info) {
        // Cria info básica
        info = this.createAudioInfo(
          defaultFile,
          path.join(this.audioPath, defaultFile),
          buffer.length
        )
      }

      return { buffer, info }
    } catch (error) {
      console.error("❌ Erro ao carregar áudio padrão:", error)

      // Fallback: cria um arquivo de teste OGG válido
      console.log("🛠️  Criando arquivo OGG de teste...")
      const mockBuffer = await this.createValidOggFile()
      const mockInfo = this.createAudioInfo(
        "test-mock.ogg",
        path.join(this.audioPath, "test-mock.ogg"),
        mockBuffer.length
      )

      // Salva o arquivo mock para uso futuro
      await fs.writeFile(mockInfo.path, mockBuffer)

      return { buffer: mockBuffer, info: mockInfo }
    }
  }

  private async checkRootAudio(): Promise<AudioFile | null> {
    const possiblePaths = [
      path.resolve(process.cwd(), env.DEFAULT_AUDIO_FILE),
      path.resolve(process.cwd(), "audio", env.DEFAULT_AUDIO_FILE),
      path.resolve(__dirname, "..", "..", "audio", env.DEFAULT_AUDIO_FILE),
    ]

    for (const filePath of possiblePaths) {
      try {
        await fs.access(filePath)
        const stats = await fs.stat(filePath)
        const filename = path.basename(filePath)

        console.log(`✅ Áudio encontrado no diretório raiz: ${filename}`)

        // Copia para o diretório de assets se necessário
        const destPath = path.join(this.audioPath, filename)
        if (filePath !== destPath) {
          await fs.copyFile(filePath, destPath)
          console.log(`📋 Copiado para: ${destPath}`)
        }

        return this.createAudioInfo(filename, destPath, stats.size)
      } catch (error) {
        // Continua para o próximo caminho
      }
    }

    return null
  }

  private createAudioInfo(filename: string, filePath: string, size: number): AudioFile {
    const fileConfig: Record<string, Partial<AudioFile>> = {
      'teste.ogg': {
        expectedText: env.EXPECTED_TRANSCRIPTION || "Teste de transcrição de áudio",
        language: 'pt-BR',
        description: 'Arquivo de teste OGG para transcrição',
      },
    }

    const config = fileConfig[filename] || {}

    return {
      filename,
      path: filePath,
      size,
      language: config.language || 'pt-BR',
      expectedText: config.expectedText || `Texto esperado para ${filename}`,
      description: config.description || 'Arquivo de áudio',
    }
  }

  private async createValidOggFile(): Promise<Buffer> {
    // Cria um arquivo OGG válido vazio (apenas header)
    // Em produção, você deveria usar um arquivo OGG real
    const oggHeader = Buffer.from([
      0x4f, 0x67, 0x67, 0x53,  // "OggS"
      0x00,                    // version
      0x00,                    // header type
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // granule position
      0x00, 0x00, 0x00, 0x00, // bitstream serial number
      0x00, 0x00, 0x00, 0x00, // page sequence number
      0x00, 0x00, 0x00, 0x00, // checksum
      0x01,                    // page segments
      0x00                     // segment length
    ])

    return oggHeader
  }

  private isAudioFile(filename: string): boolean {
    const audioExtensions = ['.wav', '.mp3', '.m4a', '.ogg', '.oga', '.flac', '.webm']
    return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext))
  }
}

export const audioService = new AudioService()