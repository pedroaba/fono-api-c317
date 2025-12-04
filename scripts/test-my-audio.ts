// scripts/test-my-audio-fixed.ts
import { transcriptionClient } from "../src/lib/transcription-client"
import { audioService } from "../src/services/audio-service"
import { env } from "../src/env"
import fs from "fs/promises"
import path from "path"

async function testMyAudioFixed() {
  console.log("🎵 TESTANDO TRANSCRIÇÃO DO ARQUIVO teste.ogg")
  console.log("=".repeat(50))

  try {
    console.log(`📁 Diretório atual: ${process.cwd()}`)
    console.log(`🔧 Configuração:`)
    console.log(`   - DEFAULT_AUDIO_FILE: ${env.DEFAULT_AUDIO_FILE}`)
    console.log(`   - TRANSCRIPTION_API_URL: ${env.TRANSCRIPTION_API_URL}`)

    // 1. Inicializar serviço de áudio
    console.log("\n🔍 Inicializando serviço de áudio...")
    await audioService["initialize"]?.() // Chama método privado se existir

    // 2. Listar áudios disponíveis
    console.log("\n📂 Listando áudios disponíveis...")
    const audios = await audioService.getAvailableAudios()

    if (audios.length === 0) {
      console.log("❌ Nenhum áudio encontrado!")
      console.log("💡 Dicas:")
      console.log("   1. Copie seu arquivo teste.ogg para src/assets/audios/")
      console.log("   2. Ou execute: cp audio/teste.ogg src/assets/audios/")
      return
    }

    console.log(`✅ Áudios encontrados: ${audios.length}`)
    audios.forEach(audio => {
      console.log(`   - ${audio.filename} (${(audio.size / 1024).toFixed(1)} KB)`)
      if (audio.expectedText) {
        console.log(`     Texto esperado: ${audio.expectedText.substring(0, 50)}...`)
      }
    })

    const targetAudio = audios.find(a => a.filename === env.DEFAULT_AUDIO_FILE)
    if (!targetAudio) {
      console.log(`\n⚠️  Arquivo ${env.DEFAULT_AUDIO_FILE} não encontrado na lista`)
      console.log(`   Usando primeiro áudio disponível: ${audios[0].filename}`)
    }

    // 3. Verificar API de transcrição
    console.log("\n🔍 Verificando API de transcrição...")
    const isHealthy = await transcriptionClient.healthCheck()

    if (!isHealthy) {
      console.log("❌ API de transcrição não está disponível")
      console.log(`ℹ️  URL: ${env.TRANSCRIPTION_API_URL}`)
      console.log("💡 Verifique se a API de transcrição está rodando:")
      console.log("   - A URL está correta?")
      console.log("   - A API está acessível?")
      console.log("   - Tentar: curl http://localhost:8000/api/v1/health")
      return
    }

    console.log("✅ API de transcrição disponível")

    // 4. Carregar e testar cada áudio
    for (const audio of audios) {
      console.log(`\n🎯 Testando: ${audio.filename}`)
      console.log("-".repeat(30))

      try {
        // Carregar áudio
        console.log(`📤 Carregando arquivo...`)
        const audioBuffer = await audioService.getAudioBuffer(audio.filename)
        console.log(`📦 Tamanho: ${(audioBuffer.length / 1024).toFixed(1)} KB`)

        if (audioBuffer.length < 100) {
          console.log("⚠️  Arquivo muito pequeno, pode ser inválido")
        }

        // Enviar para transcrição
        console.log(`📤 Enviando para transcrição...`)
        const startTime = Date.now()
        const result = await transcriptionClient.transcribeAudio(audioBuffer, audio.filename)
        const elapsedTime = Date.now() - startTime

        console.log(`✅ Transcrição recebida em ${elapsedTime}ms`)
        console.log(`📝 Texto: ${result.text}`)
        console.log(`🌐 Idioma: ${result.language || "Não identificado"}`)
        console.log(`🎯 Confiança: ${result.confidence || "Não informada"}`)

        // Comparar com texto esperado
        if (audio.expectedText) {
          console.log(`\n📊 Comparação com texto esperado:`)
          console.log(`   Esperado: ${audio.expectedText}`)

          // Cálculo de similaridade simples
          const expectedWords = new Set(
            audio.expectedText.toLowerCase()
              .replace(/[^\w\s]/g, '')
              .split(/\s+/)
              .filter(w => w.length > 0)
          )

          const actualWords = result.text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0)

          let matches = 0
          for (const word of actualWords) {
            if (expectedWords.has(word)) {
              matches++
            }
          }

          const similarity = matches / Math.max(expectedWords.size, 1)
          const percentage = (similarity * 100).toFixed(1)

          console.log(`   Similaridade: ${percentage}%`)

          if (similarity > 0.7) {
            console.log(`   ✅ Boa correspondência!`)
          } else if (similarity > 0.4) {
            console.log(`   ⚠️  Correspondência moderada`)
          } else {
            console.log(`   ❌ Baixa correspondência`)
          }
        }

        // Salvar resultado
        const resultData = {
          timestamp: new Date().toISOString(),
          audioFile: audio.filename,
          fileSize: audioBuffer.length,
          transcription: result,
          expectedText: audio.expectedText,
          processingTime: elapsedTime,
        }

        const resultFile = `transcription-${audio.filename.replace('.', '-')}-${Date.now()}.json`
        await fs.writeFile(resultFile, JSON.stringify(resultData, null, 2))
        console.log(`💾 Resultado salvo em: ${resultFile}`)

      } catch (error: any) {
        console.error(`❌ Erro ao processar ${audio.filename}:`, error.message)

        // Se for erro de arquivo não encontrado, tenta localizar
        if (error.message.includes("not found")) {
          console.log("🔍 Tentando localizar o arquivo...")

          const possiblePaths = [
            path.join(process.cwd(), "src", "assets", "audios", audio.filename),
            path.join(process.cwd(), "audio", audio.filename),
            path.join(process.cwd(), audio.filename),
            path.join(__dirname, "..", "audio", audio.filename),
          ]

          for (const filePath of possiblePaths) {
            try {
              await fs.access(filePath)
              console.log(`✅ Encontrado em: ${filePath}`)
              console.log(`💡 Copie para: src/assets/audios/`)
              break
            } catch {
              // Continua
            }
          }
        }
      }
    }

    console.log("\n🎉 Teste completo!")
    console.log("📋 Resumo dos arquivos testados:", audios.length)

  } catch (error: any) {
    console.error("\n❌ ERRO NO TESTE:", error.message)
    console.error("Stack:", error.stack)
  }
}

// Executar teste
testMyAudioFixed()