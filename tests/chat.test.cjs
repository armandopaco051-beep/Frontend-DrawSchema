const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, imports, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(output, { exports: module.exports, module, require: (id) => {
    assert.ok(id in imports, `Unexpected import: ${id}`)
    return imports[id]
  }, AbortController, URLSearchParams, ...globals })
  return module.exports
}

function harness(service) {
  let slots = [], cursor = 0, previousDeps, cleanup, pendingEffect
  const timers = new Map()
  let nextTimer = 0
  const react = {
    useState(initial) {
      const id = cursor++
      if (!(id in slots)) slots[id] = initial
      return [slots[id], (update) => { slots[id] = typeof update === 'function' ? update(slots[id]) : update }]
    },
    useEffect(effect, deps) {
      if (!previousDeps || deps.some((value, i) => value !== previousDeps[i])) {
        pendingEffect = effect
        previousDeps = deps
      }
    },
  }
  class ApiError extends Error { constructor(status) { super('Access denied'); this.status = status } }
  const { useProjectChat } = load('src/features/ai/useProjectChat.ts', {
    react, '../../services/api': { ApiError }, '../../services/chatService': service,
  }, {
    setTimeout: (fn) => { const id = ++nextTimer; timers.set(id, fn); return id },
    clearTimeout: (id) => timers.delete(id),
  })
  return {
    ApiError,
    render(project, scope, user = 'u1') {
      cursor = 0
      const result = useProjectChat(project, scope, user)
      if (pendingEffect) {
        cleanup?.()
        const effect = pendingEffect; pendingEffect = undefined
        cleanup = effect()
      }
      return result
    },
    async poll() { const entry = timers.entries().next().value; assert.ok(entry); timers.delete(entry[0]); await entry[1]() },
    dispose() { cleanup?.() },
  }
}
const flush = () => new Promise((resolve) => setImmediate(resolve))
const message = (id, text = 'Hola') => ({ id, texto: text, rol: 'user', autor_codigo: 'u1', autor_nombre: 'Ana' })

test('service uses backend routes and never sends a client-selected author', async () => {
  const calls = []
  const service = load('src/services/chatService.ts', {
    './api': { apiRequest: async (...args) => { calls.push(args); return {} } },
  })
  await service.openConversation(2, 'grupal')
  await service.sendMessage(10, 'Hola', 5)
  await service.listMessages(10, 42)
  assert.equal(calls[0][0], '/proyectos/2/conversaciones')
  assert.equal(JSON.stringify(calls[0][1].body), '{"tipo":"grupal"}')
  assert.equal(JSON.stringify(calls[1][1].body), '{"texto":"Hola","diagrama_id":5}')
  assert.match(calls[2][0], /limite=100&antes_de=42/)
})

test('scope change aborts old requests and does not show private history in group', async () => {
  let releasePrivate, privateSignal
  const h = harness({
    openConversation: (_project, scope, signal) => {
      if (scope === 'individual') { privateSignal = signal; return new Promise((resolve) => { releasePrivate = resolve }) }
      return Promise.resolve({ id: 20 })
    },
    listMessages: async () => ({ mensajes: [message(2, 'Grupo')], siguiente_antes_de: null }),
  })
  h.render(2, 'individual')
  const switching = h.render(2, 'grupal')
  assert.equal(switching.messages.length, 0)
  assert.equal(privateSignal.aborted, true)
  await flush()
  releasePrivate({ id: 10 })
  await flush()
  const current = h.render(2, 'grupal')
  assert.equal(current.messages[0].texto, 'Grupo')
  assert.equal(current.ready, true)
  h.dispose()
})

test('sending and polling deduplicate messages and revoked access clears history', async () => {
  let fail = false
  const h = harness({
    openConversation: async () => ({ id: 20 }),
    listMessages: async () => {
      if (fail) throw new h.ApiError(403)
      return { mensajes: [message(1), message(2)], siguiente_antes_de: null }
    },
    sendMessage: async () => message(2),
  })
  h.render(2, 'grupal'); await flush()
  await h.render(2, 'grupal').send('Hola')
  await h.poll()
  assert.equal(h.render(2, 'grupal').messages.length, 2)
  fail = true
  await h.poll()
  const denied = h.render(2, 'grupal')
  assert.equal(denied.ready, false)
  assert.equal(denied.messages.length, 0)
  assert.equal(denied.blocked, true)
  h.dispose()
})

test('AI response joins persisted history and survives a fresh chat load', async () => {
  const answer = { ...message(3, 'Respuesta guardada'), rol: 'assistant', autor_codigo: null, resultado_ia: { reply_to: '1' } }
  let answered = false
  const service = {
    openConversation: async () => ({ id: 20 }),
    listMessages: async () => ({ mensajes: answered ? [message(1), answer] : [message(1)], siguiente_antes_de: null }),
    requestAiReply: async (conversation, messageId) => {
      assert.equal(conversation, 20); assert.equal(messageId, 1)
      answered = true
      return answer
    },
  }
  const h = harness(service)
  h.render(2, 'individual'); await flush()
  await h.render(2, 'individual').respond(1)
  assert.equal(h.render(2, 'individual').messages[1].texto, 'Respuesta guardada')
  h.dispose()
  const reloaded = harness(service)
  reloaded.render(2, 'individual'); await flush()
  assert.equal(reloaded.render(2, 'individual').messages[1].rol, 'assistant')
  reloaded.dispose()
})

test('text provider is selected per request without sending credentials', async () => {
  const calls = []
  const service = load('src/services/chatService.ts', {
    './api': { apiRequest: async (...args) => { calls.push(args); return {} } },
  })
  await service.requestAiReply(10, 3, 5, 'local')
  await service.requestAiReply(10, 4, 5, 'gemini')
  assert.match(calls[0][0], /text_provider=local/)
  assert.match(calls[0][0], /expected_diagrama_id=5/)
  assert.match(calls[1][0], /text_provider=gemini/)
  assert.equal(JSON.stringify(calls[0][1]), '{"method":"POST"}')
})
