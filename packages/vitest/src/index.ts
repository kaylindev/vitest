import type {
  Plugin as PrettyFormatPlugin,
} from 'pretty-format'
import type { Any, Anything } from './integrations/chai/jest-asymmetric-matchers'
import type { MatcherState, MatchersObject } from './integrations/chai/types'
import type { Constructable, InlineConfig } from './types'

type VitestInlineConfig = InlineConfig

export { suite, test, describe, it } from './runtime/suite'
export * from './runtime/hooks'
export * from './integrations/chai'
export * from './integrations/jest-mock'
export * from './integrations/vi'

export * from './types'
export * from './api/types'

declare module 'vite' {
  interface UserConfig {
    /**
     * Options for Vitest
     */
    test?: VitestInlineConfig
  }
}

interface AsymmetricMatchersContaining {
  stringContaining(expected: string): any
  objectContaining(expected: any): any
  arrayContaining(expected: unknown[]): any
  stringMatching(expected: string | RegExp): any
}

type Promisify<O> = {
  [K in keyof O]: O[K] extends (...args: infer A) => infer R
    ? O extends R
      ? Promisify<O[K]>
      : (...args: A) => Promise<R>
    : O[K]
}

declare global {
  namespace Vi {

    interface ExpectStatic extends Chai.ExpectStatic, AsymmetricMatchersContaining {
      <T>(actual: T, message?: string): Vi.Assertion<T>

      extend(expects: MatchersObject): void
      assertions(expected: number): void
      hasAssertions(): void
      anything(): Anything
      any(constructor: unknown): Any
      addSnapshotSerializer(plugin: PrettyFormatPlugin): void
      getState(): MatcherState
      setState(state: Partial<MatcherState>): void
      not: AsymmetricMatchersContaining
    }

    interface JestAssertion<T = any> {
      // Snapshot
      toMatchSnapshot<U extends { [P in keyof T]: any }>(snapshot: Partial<U>, message?: string): void
      toMatchSnapshot(message?: string): void
      matchSnapshot<U extends { [P in keyof T]: any }>(snapshot: Partial<U>, message?: string): void
      matchSnapshot(message?: string): void
      toMatchInlineSnapshot<U extends { [P in keyof T]: any }>(properties: Partial<U>, snapshot?: string, message?: string): void
      toMatchInlineSnapshot(snapshot?: string, message?: string): void
      toThrowErrorMatchingSnapshot(message?: string): void
      toThrowErrorMatchingInlineSnapshot(snapshot?: string, message?: string): void

      // Jest compact
      toEqual<E>(expected: E): void
      toStrictEqual<E>(expected: E): void
      toBe<E>(expected: E): void
      toMatch(expected: string | RegExp): void
      toMatchObject<E extends {} | any[]>(expected: E): void
      toContain<E>(item: E): void
      toContainEqual<E>(item: E): void
      toBeTruthy(): void
      toBeFalsy(): void
      toBeGreaterThan(num: number): void
      toBeGreaterThanOrEqual(num: number): void
      toBeLessThan(num: number): void
      toBeLessThanOrEqual(num: number): void
      toBeNaN(): void
      toBeUndefined(): void
      toBeNull(): void
      toBeDefined(): void
      toBeInstanceOf<E>(expected: E): void
      toBeCalledTimes(times: number): void
      toHaveLength(length: number): void
      toHaveProperty<E>(property: string, value?: E): void
      toBeCloseTo(number: number, numDigits?: number): void
      toHaveBeenCalledTimes(times: number): void
      toHaveBeenCalledOnce(): void
      toHaveBeenCalled(): void
      toBeCalled(): void
      toHaveBeenCalledWith<E extends any[]>(...args: E): void
      toBeCalledWith<E extends any[]>(...args: E): void
      toHaveBeenNthCalledWith<E extends any[]>(n: number, ...args: E): void
      nthCalledWith<E extends any[]>(nthCall: number, ...args: E): void
      toHaveBeenLastCalledWith<E extends any[]>(...args: E): void
      lastCalledWith<E extends any[]>(...args: E): void
      toThrow(expected?: string | Constructable | RegExp | Error): void
      toThrowError(expected?: string | Constructable | RegExp | Error): void
      toReturn(): void
      toHaveReturned(): void
      toReturnTimes(times: number): void
      toHaveReturnedTimes(times: number): void
      toReturnWith<E>(value: E): void
      toHaveReturnedWith<E>(value: E): void
      toHaveLastReturnedWith<E>(value: E): void
      lastReturnedWith<E>(value: E): void
      toHaveNthReturnedWith<E>(nthCall: number, value: E): void
      nthReturnedWith<E>(nthCall: number, value: E): void
    }

    type VitestifyAssertion<A> = {
      [K in keyof A]: A[K] extends Chai.Assertion
        ? Assertion<any>
        : A[K] extends (...args: any[]) => any
          ? A[K] // not converting function since they may contain overload
          : VitestifyAssertion<A[K]>
    }

    interface Assertion<T = any> extends VitestifyAssertion<Chai.Assertion>, JestAssertion<T> {
      resolves: Promisify<Assertion<T>>
      rejects: Promisify<Assertion<T>>
    }
  }
}
