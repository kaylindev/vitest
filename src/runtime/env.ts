import { setupChai } from '../integrations/chai/setup'
import { ResolvedConfig } from '../types'

export async function setupEnv(config: ResolvedConfig) {
  await setupChai()

  if (config.global)
    (await import('../integrations/global')).registerApiGlobally()

  // TODO: rework this
  if (config.dom === 'happy-dom')
    return (await import('../integrations/dom/happy-dom')).setupHappyDOM(globalThis).restore
  else if (config.dom)
    return (await import('../integrations/dom/jsdom')).setupJSDOM(globalThis).restore
}
