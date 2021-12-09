import { ResolvedConfig, RunnerContext } from '../types'
import { DefaultReporter } from '../reporters/default'
import { getSnapshotManager } from '../integrations/chai/snapshot'
import { getTasks } from '../utils'
import { setupEnv } from './env'

export async function setupRunner(config: ResolvedConfig) {
  await setupEnv(config)

  const ctx: RunnerContext = {
    filesMap: {},
    get files() {
      return Object.values(this.filesMap)
    },
    get tasks() {
      return getTasks(Object.values(this.filesMap))
    },
    config,
    reporter: config.reporter || new DefaultReporter(),
    snapshotManager: getSnapshotManager(),
  }

  return ctx
}
