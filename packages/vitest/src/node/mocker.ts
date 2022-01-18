import { existsSync, readdirSync } from 'fs'
import { isNodeBuiltin } from 'mlly'
import { basename, dirname, join, resolve } from 'pathe'
import type { ModuleCache } from 'vite-node'
import { toFilePath } from 'vite-node/utils'
import { spies, spyOn } from '../integrations/jest-mock'
import { mergeSlashes, normalizeId } from '../utils'
import type { ExecuteOptions } from './execute'

export type SuiteMocks = Record<string, Record<string, string | null | (() => unknown)>>

type Callback = (...args: any[]) => unknown

interface PendingSuiteMock {
  id: string
  importer: string
  type: 'mock' | 'unmock'
  factory?: () => unknown
}

function getObjectType(value: unknown): string {
  return Object.prototype.toString.apply(value).slice(8, -1)
}

function mockPrototype(proto: any) {
  if (!proto) return null

  const newProto: any = {}

  const protoDescr = Object.getOwnPropertyDescriptors(proto)

  // eslint-disable-next-line no-restricted-syntax
  for (const d in protoDescr) {
    Object.defineProperty(newProto, d, protoDescr[d])

    if (typeof protoDescr[d].value === 'function')
      spyOn(newProto, d).mockImplementation(() => {})
  }

  return newProto
}

const pendingIds: PendingSuiteMock[] = []

export class VitestMocker {
  private request!: (dep: string) => unknown

  private root: string
  // private mockMap: SuiteMocks

  private callbacks: Record<string, ((...args: any[]) => unknown)[]> = {}

  constructor(
    public options: ExecuteOptions,
    private moduleCache: Map<string, ModuleCache>,
    request?: (dep: string) => unknown,
  ) {
    this.root = this.options.root
    // this.mockMap = options.mockMap
    this.request = request!
  }

  get mockMap() {
    return this.options.mockMap
  }

  public on(event: string, cb: Callback) {
    this.callbacks[event] ??= []
    this.callbacks[event].push(cb)
  }

  private emit(event: string, ...args: any[]) {
    (this.callbacks[event] ?? []).forEach(fn => fn(...args))
  }

  public getSuiteFilepath() {
    return process.__vitest_worker__?.filepath || 'global'
  }

  public getMocks() {
    const suite = this.getSuiteFilepath()
    const suiteMocks = this.mockMap[suite || '']
    const globalMocks = this.mockMap.global

    return {
      ...suiteMocks,
      ...globalMocks,
    }
  }

  private async resolvePath(id: string, importer: string) {
    const path = await this.options.resolveId(id, importer)
    return {
      path: normalizeId(path?.id || id),
      external: path?.id.includes('/node_modules/') ? id : null,
    }
  }

  private async resolveMocks() {
    await Promise.all(pendingIds.map(async(mock) => {
      const { path, external } = await this.resolvePath(mock.id, mock.importer)
      if (mock.type === 'unmock')
        this.unmockPath(path, external)
      if (mock.type === 'mock')
        this.mockPath(path, external, mock.factory)
    }))

    pendingIds.length = 0
  }

  private async callFunctionMock(dep: string, mock: () => any) {
    const cacheName = `${dep}__mock`
    const cached = this.moduleCache.get(cacheName)?.exports
    if (cached)
      return cached
    const exports = await mock()
    this.emit('mocked', cacheName, { exports })
    return exports
  }

  public getDependencyMock(dep: string) {
    return this.getMocks()[this.resolveDependency(dep)]
  }

  // npm resolves as /node_modules, but we store as /@fs/.../node_modules
  public resolveDependency(dep: string) {
    if (dep.startsWith('/node_modules/'))
      dep = mergeSlashes(`/@fs/${join(this.root, dep)}`)

    return normalizeId(dep)
  }

  public getActualPath(path: string, external: string | null) {
    if (external)
      return mergeSlashes(`/@fs/${path}`)

    return normalizeId(path.replace(this.root, ''))
  }

  public resolveMockPath(mockPath: string, external: string | null) {
    const path = normalizeId(external || mockPath)

    // it's a node_module alias
    // all mocks should be inside <root>/__mocks__
    if (external || isNodeBuiltin(mockPath)) {
      const mockDirname = dirname(path) // for nested mocks: @vueuse/integration/useJwt
      const baseFilename = basename(path)
      const mockFolder = resolve(this.root, '__mocks__', mockDirname)

      if (!existsSync(mockFolder)) return null

      const files = readdirSync(mockFolder)

      for (const file of files) {
        const [basename] = file.split('.')
        if (basename === baseFilename)
          return resolve(mockFolder, file).replace(this.root, '')
      }

      return null
    }

    const dir = dirname(path)
    const baseId = basename(path)
    const fullPath = resolve(dir, '__mocks__', baseId)
    return existsSync(fullPath) ? fullPath.replace(this.root, '') : null
  }

  public mockObject(obj: any) {
    const type = getObjectType(obj)

    if (Array.isArray(obj))
      return []
    else if (type !== 'Object' && type !== 'Module')
      return obj

    const newObj = { ...obj }

    const proto = mockPrototype(Object.getPrototypeOf(obj))
    Object.setPrototypeOf(newObj, proto)

    // eslint-disable-next-line no-restricted-syntax
    for (const k in obj) {
      newObj[k] = this.mockObject(obj[k])
      const type = getObjectType(obj[k])

      if (type.includes('Function') && !obj[k].__isSpy) {
        spyOn(newObj, k).mockImplementation(() => {})
        Object.defineProperty(newObj[k], 'length', { value: 0 }) // tinyspy retains length, but jest doesnt
      }
    }
    return newObj
  }

  public unmockPath(path: string, external: string | null) {
    const suitefile = this.getSuiteFilepath()

    const fsPath = this.getActualPath(path, external)

    if (this.mockMap[suitefile]?.[fsPath])
      delete this.mockMap[suitefile][fsPath]
  }

  public mockPath(path: string, external: string | null, factory?: () => any) {
    const suitefile = this.getSuiteFilepath()

    const fsPath = this.getActualPath(path, external)

    this.mockMap[suitefile] ??= {}
    this.mockMap[suitefile][fsPath] = factory || this.resolveMockPath(path, external)
  }

  public async importActual<T>(id: string, importer: string): Promise<T> {
    const { path, external } = await this.resolvePath(id, importer)
    const fsPath = this.getActualPath(path, external)
    const result = await this.request(fsPath)
    return result as T
  }

  public async importMock(id: string, importer: string): Promise<any> {
    const { path, external } = await this.resolvePath(id, importer)

    let mock = this.getDependencyMock(path)

    if (mock === undefined)
      mock = this.resolveMockPath(path, external)

    if (mock === null) {
      const fsPath = this.getActualPath(path, external)
      const mod = await this.request(fsPath)
      return this.mockObject(mod)
    }
    if (typeof mock === 'function')
      return this.callFunctionMock(path, mock)
    return this.requestWithMock(mock)
  }

  public async requestWithMock(dep: string) {
    await this.resolveMocks()

    const mock = this.getDependencyMock(dep)

    if (mock === null) {
      const cacheName = `${dep}__mock`
      const cache = this.moduleCache.get(cacheName)
      if (cache?.exports)
        return cache.exports
      const cacheKey = toFilePath(dep, this.root)
      const mod = this.moduleCache.get(cacheKey)?.exports || await this.request(dep)
      const exports = this.mockObject(mod)
      this.emit('mocked', cacheName, { exports })
      return exports
    }
    if (typeof mock === 'function')
      return this.callFunctionMock(dep, mock)
    if (typeof mock === 'string')
      dep = mock
    return this.request(dep)
  }

  public clearMocks({ clearMocks, mockReset, restoreMocks }: { clearMocks?: boolean; mockReset?: boolean; restoreMocks?: boolean }) {
    if (!clearMocks && !mockReset && !restoreMocks)
      return

    spies.forEach((s) => {
      if (restoreMocks)
        s.mockRestore()
      else if (mockReset)
        s.mockReset()
      else if (clearMocks)
        s.mockClear()
    })
  }

  public queueMock(id: string, importer: string, factory?: () => unknown) {
    pendingIds.push({ type: 'mock', id, importer, factory })
  }

  public queueUnmock(id: string, importer: string) {
    pendingIds.push({ type: 'unmock', id, importer })
  }

  public withRequest(request: (dep: string) => unknown) {
    return new VitestMocker(this.options, this.moduleCache, request)
  }
}
