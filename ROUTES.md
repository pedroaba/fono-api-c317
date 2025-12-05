# Guia de rotas da Fono API

## Como subir e base de testes
- Servidor local: `http://localhost:3001` (porta exposta pelo docker-compose; se rodar fora do compose, ajuste para a porta usada).
- Prefixo de versao: `API_PREFIX = /api/v1`. As rotas de teste de audio/transcricao usam apenas `/api`.
- Autenticacao: o login cria um cookie `session` (ou voce pode enviar o valor via header `session`). Use `-c cookies.txt` para salvar e `-b cookies.txt` para reutilizar nos comandos.
- Subida rapida: `pnpm install` e `pnpm dev` (ou `pnpm start` apos `pnpm build`). Configure `DATABASE_URL` e `SECRET_KEY` no `.env`.

## Insomnia (configuracao rapida)
- Crie um Environment com `baseUrl = http://localhost:3001`.
- Adicione um Request `POST {{ baseUrl }}/api/v1/auth/sign-in` com body JSON `{ "email": "user@example.com", "password": "senha123" }`. O Insomnia guarda o cookie `session` automaticamente.
- Rotas autenticadas: use o cookie salvo (Insomnia envia sozinho) ou adicione header `session: <valor-do-cookie>` se precisar testar sem cookie.
- Exemplo GET health: `GET {{ baseUrl }}/health/health`.
- Exemplo rota autenticada: `GET {{ baseUrl }}/api/v1/users/me` (depois de fazer sign-in).

### Login rapido para testes autenticados
```bash
# Cria cookie para rotas protegidas (host local na porta 3001)
curl -i -c cookies.txt -X POST http://localhost:3001/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@example.com\",\"password\":\"senha123\"}"
```

## Health
- `GET /health/health` (tambem em `/api/v1/health/health`): verifica status.
  - Teste: `curl http://localhost:3001/health/health`

## Auth (`/api/v1/auth`)
- `POST /sign-in`: corpo `{ email, password }`, devolve cookie `session`.
  - Teste: vide bloco "Login rapido".
- `GET /logout` (autenticado): invalida a sessao.
  - Teste: `curl -X GET http://localhost:3001/api/v1/auth/logout -b cookies.txt -i`

## Usuarios (`/api/v1/users`)
- `POST /` Criar usuario: `{ email, password, name }`.
  - Teste: `curl -X POST http://localhost:3001/api/v1/users -H "Content-Type: application/json" -d "{\"email\":\"novo@exemplo.com\",\"password\":\"senha123\",\"name\":\"Nome\"}"`
- `GET /me` (autenticado): dados do usuario logado.
  - Teste: `curl http://localhost:3001/api/v1/users/me -b cookies.txt`
- `GET /:id` (autenticado): busca por id.
  - Teste: `curl http://localhost:3001/api/v1/users/<id> -b cookies.txt`
- `PATCH /:id` (autenticado): atualiza `{ email?, name? }`.
  - Teste: `curl -X PATCH http://localhost:3001/api/v1/users/<id> -H "Content-Type: application/json" -d "{\"name\":\"Novo Nome\"}" -b cookies.txt -i`
- `DELETE /:id` (autenticado): remove usuario e invalida sessoes.
  - Teste: `curl -X DELETE http://localhost:3001/api/v1/users/<id> -b cookies.txt -i`
- `GET /` (autenticado): lista com filtros `name`, `email`, `page`, `limit`.
  - Teste: `curl \"http://localhost:3001/api/v1/users?name=john&page=1&limit=10\" -b cookies.txt`

## Session tests (`/api/v1/session-tests`)
- `POST /session-tests`: corpo `{ userId }`, cria sessao de teste.
  - Teste: `curl -X POST http://localhost:3001/api/v1/session-tests -H "Content-Type: application/json" -d "{\"userId\":\"<id>\"}"`
- `GET /session-tests?userId=...`: lista por usuario.
  - Teste: `curl \"http://localhost:3001/api/v1/session-tests?userId=<id>\"`
- `GET /session-tests/:id`: busca unico.
  - Teste: `curl http://localhost:3001/api/v1/session-tests/<id>`
- `DELETE /session-tests/:id`: remove.
  - Teste: `curl -X DELETE http://localhost:3001/api/v1/session-tests/<id> -i`

## Pronounce tests (`/api/v1/pronounce-tests`)
- `POST /pronounce-tests`: `{ userId, sessionTestId, score?, feedback? }`. Exige que o `sessionTestId` exista para o `userId`.
  - Teste: `curl -X POST http://localhost:3001/api/v1/pronounce-tests -H "Content-Type: application/json" -d "{\"userId\":\"<userId>\",\"sessionTestId\":\"<sessionTestId>\",\"score\":90,\"feedback\":\"bom\"}"`
- `GET /pronounce-tests?userId=...&sessionTestId?=...`: lista por usuario e opcionalmente por sessao de teste.
  - Teste: `curl \"http://localhost:3001/api/v1/pronounce-tests?userId=<userId>\"`
- `GET /pronounce-tests/:id`: busca unico.
  - Teste: `curl http://localhost:3001/api/v1/pronounce-tests/<id>`
- `PATCH /pronounce-tests/:id`: atualiza `score` e/ou `feedback`.
  - Teste: `curl -X PATCH http://localhost:3001/api/v1/pronounce-tests/<id> -H "Content-Type: application/json" -d "{\"feedback\":\"ajuste\"}"`
- `DELETE /pronounce-tests/:id`: remove teste.
  - Teste: `curl -X DELETE http://localhost:3001/api/v1/pronounce-tests/<id> -i`

## Pronounces (`/api/v1/pronounces`)
- `POST /`: cria pronuncia com `{ word, speak: number[], userId }`.
  - Teste: `curl -X POST http://localhost:3001/api/v1/pronounces -H "Content-Type: application/json" -d "{\"word\":\"hello\",\"speak\":[1,2,3],\"userId\":\"<uuid>\"}"`
- `GET /`: lista com filtros `word`, `userId`, `page`, `limit`.
  - Teste: `curl \"http://localhost:3001/api/v1/pronounces?word=he&page=1&limit=5\"`
- `DELETE /:id`: remove pronuncia.
  - Teste: `curl -X DELETE http://localhost:3001/api/v1/pronounces/<id> -i`

## Transcription test (prefix `/api`)
- `POST /transcription-test/default`: transcreve o audio padrao definido em `DEFAULT_AUDIO_FILE`.
  - Teste: `curl -X POST http://localhost:3001/api/transcription-test/default`
- `GET /transcription-test/audios`: lista audios em `src/assets/audios` (e fallbacks).
  - Teste: `curl http://localhost:3001/api/transcription-test/audios`
- `POST /transcription-test/audio/:filename`: transcreve um arquivo especifico do diretario de audios.
  - Teste: `curl -X POST http://localhost:3001/api/transcription-test/audio/teste.ogg`
- `POST /transcription-test/batch`: roda transcricao para todos os audios disponiveis.
  - Teste: `curl -X POST http://localhost:3001/api/transcription-test/batch`

## Test audio (prefix `/api`)
Depende da API externa em `TRANSCRIPTION_API_URL` (padrao `http://localhost:8000/api/v1/transcribe/file`). Coloque audios em `src/assets/audios` ou use upload.

- `POST /test-audio`: usa o audio padrao (`DEFAULT_AUDIO_FILE`, padrao `teste.ogg`). Corpo opcional `{ compareWithExpected?, languageHint? }`.
  - Teste: `curl -X POST http://localhost:3001/api/test-audio -H "Content-Type: application/json" -d "{\"compareWithExpected\":true}"`
- `GET /test-audio/info`: info do audio padrao e lista de audios detectados.
  - Teste: `curl http://localhost:3001/api/test-audio/info`
- `POST /test-audio/upload` (multipart): envia audio customizado, opcional `expectedText`.
  - Teste: `curl -X POST http://localhost:3001/api/test-audio/upload -F \"audio=@caminho/para/audio.ogg\" -F \"expectedText=frase esperada\"`

## Extras
- Documentacao interativa: `http://localhost:3001/reference` (swagger/scalar).
- Para rotas autenticadas sem cookies, envie header `session: <token>` retornado no login.
