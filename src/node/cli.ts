/* eslint-disable no-console */
import sade from 'sade'
import c from 'picocolors'
import { install as installSourceMapSupport } from 'source-map-support'
import type { UserOptions, VitestContext } from '../types'
import { version } from '../../package.json'
import { DefaultReporter } from '../reporters/default'
import { SnapshotManager } from '../integrations/snapshot/manager'
import { initViteServer } from './init'
import { start } from './run'
import { StateManager } from './state'

sade('vitest [filter]', true)
  .version(version)
  .describe('A blazing fast unit test framework powered by Vite.')
  .option('-r, --root', 'root path', process.cwd())
  .option('-c, --config', 'path to config file')
  .option('-w, --watch', 'watch mode', false)
  .option('-u, --update', 'update snapshot', false)
  .option('--global', 'inject apis globally', false)
  .option('--dom', 'mock browser api using jsdom or happy-dom', '')
  .action(async(filters, argv: UserOptions) => {
    process.env.VITEST = 'true'

    console.log(c.magenta(c.bold('\nVitest is in closed beta exclusively for Sponsors')))
    console.log(c.yellow('Learn more at https://vitest.dev\n'))

    const { config, server } = await initViteServer({ ...argv, filters })

    const ctx = process.__vitest__ = {
      server,
      config,
      state: new StateManager(),
      snapshot: new SnapshotManager(config),
      reporter: config.reporter,
    }

    installSourceMapSupport({
      environment: 'node',
      hookRequire: true,
      handleUncaughtExceptions: true,
      retrieveSourceMap: (id: string) => {
        const map = ctx.server.moduleGraph.getModuleById(id)?.ssrTransformResult?.map
        if (map) {
          return {
            url: id,
            map: map as any,
          }
        }
        return null
      },
    })

    ctx.reporter ||= new DefaultReporter(ctx)

    try {
      await start(ctx)
    }
    catch (e) {
      process.exitCode = 1
      throw e
    }
    finally {
      if (!config.watch)
        await server.close()
    }

    // const timer = setTimeout(() => {
    //   // TODO: warn user and maybe error out
    //   process.exit()
    // }, 500)
    // timer.unref()
  })
  .parse(process.argv)

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Process {
      __vitest__: VitestContext
    }
  }
}
