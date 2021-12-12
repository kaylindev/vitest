import { Console } from 'console'
import { Writable } from 'stream'
import { environments } from '../env'
import { setupChai } from '../integrations/chai/setup'
import type { ResolvedConfig } from '../types'
import { send } from './rpc'

let globalSetup = false
export async function setupGlobalEnv(config: ResolvedConfig) {
  if (globalSetup)
    return

  globalSetup = true

  setupConsoleLogSpy()
  await setupChai()

  if (config.global)
    (await import('../integrations/global')).registerApiGlobally()
}

export function setupConsoleLogSpy() {
  const stdout = new Writable({
    write(data, encoding, callback) {
      send('log', {
        type: 'stdout',
        content: String(data),
        taskId: process.__vitest_worker__.current?.id,
      })
      callback()
    },
  })
  const stderr = new Writable({
    write(data, encoding, callback) {
      send('log', {
        type: 'stderr',
        content: String(data),
        taskId: process.__vitest_worker__.current?.id,
      })
      callback()
    },
  })
  const newConsole = new Console({
    stdout,
    stderr,
    colorMode: true,
    groupIndentation: 2,
  })

  globalThis.console = newConsole
}

export async function withEnv(name: ResolvedConfig['environment'], fn: () => Promise<void>) {
  const env = await environments[name].setup(globalThis)
  try {
    await fn()
  }
  finally {
    await env.teardown(globalThis)
  }
}
