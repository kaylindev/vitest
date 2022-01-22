import type { TransformResult, ViteDevServer } from 'vite'
import { shouldExternalize } from './externalize'
import type { ViteNodeResolveId, ViteNodeServerOptions } from './types'
import { toFilePath, withInlineSourcemap } from './utils'

export * from './externalize'

export class ViteNodeServer {
  promiseMap = new Map<string, Promise<TransformResult | null | undefined>>()

  constructor(
    public server: ViteDevServer,
    public options: ViteNodeServerOptions = {},
  ) {}

  shouldExternalize(id: string) {
    return shouldExternalize(id, this.options.deps)
  }

  async fetchModule(id: string) {
    const externalize = await this.shouldExternalize(toFilePath(id, this.server.config.root))
    if (externalize)
      return { externalize }
    const r = await this.transformRequest(id)
    return { code: r?.code }
  }

  async resolveId(id: string, importer?: string): Promise<ViteNodeResolveId | null> {
    return this.server.pluginContainer.resolveId(id, importer, { ssr: true })
  }

  async transformRequest(id: string) {
    // reuse transform for concurrent requests
    if (!this.promiseMap.has(id)) {
      this.promiseMap.set(id,
        this._transformRequest(id)
          .finally(() => {
            this.promiseMap.delete(id)
          }),
      )
    }
    return this.promiseMap.get(id)
  }

  private getTransformMode(id: string) {
    const withoutQuery = id.split('?')[0]

    if (this.options.transformMode?.web?.some(r => withoutQuery.match(r)))
      return 'web'
    if (this.options.transformMode?.ssr?.some(r => withoutQuery.match(r)))
      return 'ssr'

    if (withoutQuery.match(/\.([cm]?[jt]sx?|json)$/))
      return 'ssr'
    return 'web'
  }

  private async _transformRequest(id: string) {
    let result: TransformResult | null = null

    const mode = this.getTransformMode(id)
    if (mode === 'web') {
      // for components like Vue, we want to use the client side
      // plugins but then covert the code to be consumed by the server
      result = await this.server.transformRequest(id)
      if (result)
        result = await this.server.ssrTransform(result.code, result.map, id)
    }
    else {
      result = await this.server.transformRequest(id, { ssr: true })
    }

    if (this.options.sourcemap !== false && result && !id.includes('node_modules'))
      withInlineSourcemap(result)

    // if (result?.map && process.env.NODE_V8_COVERAGE)
    //   visitedFilesMap.set(toFilePath(id, config.root), result.map as any)

    return result
  }
}

