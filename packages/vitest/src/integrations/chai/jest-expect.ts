import type { Spy } from 'tinyspy'
import { equals } from './jest-utils'
import type { ChaiPlugin } from './types'

// Jest Expect Compact
// TODO: add more https://jestjs.io/docs/expect
export function JestChaiExpect(): ChaiPlugin {
  return (chai, utils) => {
    function def(name: keyof Chai.Assertion | (keyof Chai.Assertion)[], fn: ((this: Chai.AssertionStatic & Chai.Assertion, ...args: any[]) => any)) {
      const addMethod = (n: keyof Chai.Assertion) => {
        utils.addMethod(chai.Assertion.prototype, n, fn)
      }

      if (Array.isArray(name))
        name.forEach(n => addMethod(n))

      else
        addMethod(name)
    }

    def('toEqual', function(expected) {
      return this.eql(expected)
    })
    def('toStrictEqual', function(expected) {
      return this.equal(expected)
    })
    def('toBe', function(expected) {
      return this.equal(expected)
    })
    def('toMatchObject', function(expected) {
      return this.containSubset(expected)
    })
    def('toMatch', function(expected: string | RegExp) {
      if (typeof expected === 'string')
        return this.include(expected)
      else
        return this.match(expected)
    })
    def('toContain', function(item) { return this.contain(item) })
    def('toContainEqual', function(expected) {
      const obj = utils.flag(this, 'object')
      const index = Array.from(obj).findIndex((item) => {
        try {
          chai.assert.deepEqual(item, expected)
        }
        catch {
          return false
        }
        return true
      })

      this.assert(
        index !== -1,
        'expected #{this} to deep equally contain #{exp}',
        'expected #{this} to not deep equally contain #{exp}',
        expected,
      )
    })
    def('toBeTruthy', function() {
      const obj = utils.flag(this, 'object')
      this.assert(
        Boolean(obj),
        'expected #{this} to be truthy',
        'expected #{this} to not be truthy',
        obj,
      )
    })
    def('toBeFalsy', function() {
      const obj = utils.flag(this, 'object')
      this.assert(
        !obj,
        'expected #{this} to be falsy',
        'expected #{this} to not be falsy',
        obj,
      )
    })
    def('toBeGreaterThan', function(expected: number) {
      return this.to.greaterThan(expected)
    })
    def('toBeGreaterThanOrEqual', function(expected: number) {
      return this.to.greaterThanOrEqual(expected)
    })
    def('toBeLessThan', function(expected: number) {
      return this.to.lessThan(expected)
    })
    def('toBeLessThanOrEqual', function(expected: number) {
      return this.to.lessThanOrEqual(expected)
    })
    def('toBeNaN', function() {
      return this.be.NaN
    })
    def('toBeUndefined', function() {
      return this.be.undefined
    })
    def('toBeNull', function() {
      return this.be.null
    })
    def('toBeDefined', function() {
      return this.not.be.undefined
    })
    def('toBeInstanceOf', function(obj: any) {
      return this.instanceOf(obj)
    })
    def('toHaveLength', function(length: number) {
      return this.have.length(length)
    })
    // destructuring, because it checks `arguments` inside, and value is passing as `undefined`
    def('toHaveProperty', function(...args: [property: string, value?: any]) {
      return this.have.deep.nested.property(...args)
    })
    def('toBeCloseTo', function(number: number, numDigits = 2) {
      utils.expectTypes(this, ['number'])
      return this.closeTo(number, numDigits)
    })

    // mock
    // TODO - currently published version doesnt have a way to determain this
    // function isSpy(putativeSpy: any) {
    //   return typeof putativeSpy === 'function'
    //          && '__isSpy' in putativeSpy
    //          && putativeSpy.__isSpy
    // }
    // const assertIsMock = (assertion: any) => {
    //   if (!isSpy(assertion._obj))
    //     throw new TypeError(`${utils.inspect(assertion._obj)} is not a spy or a call to a spy!`)
    // }
    const getSpy = (assertion: any) => {
      // assertIsMock(assertion)
      return assertion._obj as Spy<any[], any>
    }
    def(['toHaveBeenCalledTimes', 'toBeCalledTimes'], function(number: number) {
      return this.assert(
        getSpy(this).callCount === number,
        'expected spy to be called #{exp} times',
        'expected spy to not be called #{exp} times',
        number,
      )
    })
    def('toHaveBeenCalledOnce', function() {
      return this.assert(
        getSpy(this).callCount === 1,
        'expected spy to be called once',
        'expected spy to not be called once',
        1,
      )
    })
    def(['toHaveBeenCalled', 'toBeCalled'], function() {
      return this.assert(
        getSpy(this).called,
        'expected spy to be called at least once',
        'expected spy to not be called at all',
        true,
      )
    })
    def(['toHaveBeenCalledWith', 'toBeCalledWith'], function(...args) {
      const spy = getSpy(this)
      const pass = spy.calls.some(callArg => equals(callArg, args))
      return this.assert(
        pass,
        'expected spy to be called with arguments: #{exp}',
        'expected spy to not be called with arguments: #{exp}',
        args,
      )
    })
    const ordinalOf = (i: number) => {
      const j = i % 10
      const k = i % 100

      if (j === 1 && k !== 11)
        return `${i}st`

      if (j === 2 && k !== 12)
        return `${i}nd`

      if (j === 3 && k !== 13)
        return `${i}rd`

      return `${i}th`
    }
    def(['toHaveBeenNthCalledWith', 'nthCalledWith'], function(times: number, ...args: any[]) {
      const spy = getSpy(this)
      const nthCall = spy.calls[times - 1]

      this.assert(
        equals(nthCall, args),
        `expected ${ordinalOf(times)} spy call to have been called with #{exp}`,
        `expected ${ordinalOf(times)} spy call to not have been called with #{exp}`,
        args,
        nthCall,
      )
    })
    def(['toHaveBeenLastCalledWith', 'lastCalledWith'], function(...args: any[]) {
      const spy = getSpy(this)
      const lastCall = spy.calls.at(-1)

      this.assert(
        equals(lastCall, args),
        'expected last spy call to have been called with #{exp}',
        'expected last spy call to not have been called with #{exp}',
        args,
        lastCall,
      )
    })
    def(['toThrow', 'toThrowError'], function(expected: string | RegExp) {
      const negate = utils.flag(this, 'negate')

      if (negate)
        this.not.to.throw(expected)
      else
        this.to.throw(expected)
    })
    def(['toHaveReturned', 'toReturn'], function() {
      const spy = getSpy(this)
      const calledAndNotThrew = spy.called && !spy.results.some(([type]) => type === 'error')
      this.assert(
        calledAndNotThrew,
        'expected spy to be successfully called at least once',
        'expected spy to not be successfully called',
        calledAndNotThrew,
        !calledAndNotThrew,
      )
    })
    def(['toHaveReturnedTimes', 'toReturnTimes'], function(times: number) {
      const spy = getSpy(this)
      const successfullReturns = spy.results.reduce((success, [type]) => type === 'error' ? success : ++success, 0)
      this.assert(
        successfullReturns === times,
        `expected spy to be successfully called ${times} times`,
        `expected spy to not be successfully called ${times} times`,
        `expected number of returns: ${times}`,
        `recieved number of returns: ${successfullReturns}`,
      )
    })
    def(['toHaveReturnedWith', 'toReturnWith'], function(value: any) {
      const spy = getSpy(this)
      const pass = spy.results.some(([type, result]) => type === 'ok' && equals(value, result))
      this.assert(
        pass,
        'expected spy to be successfully called with #{exp}',
        'expected spy to not be successfully called with #{exp}',
        value,
      )
    })
    def(['toHaveLastReturnedWith', 'lastReturnedWith'], function(value: any) {
      const spy = getSpy(this)
      const lastResult = spy.returns.at(-1)
      const pass = equals(lastResult, value)
      this.assert(
        pass,
        'expected last spy call to return #{exp}',
        'expected last spy call to not return #{exp}',
        value,
        lastResult,
      )
    })
    def(['toHaveNthReturnedWith', 'nthReturnedWith'], function(nthCall: number, value: any) {
      const spy = getSpy(this)
      const isNot = utils.flag(this, 'negate') as boolean
      const [callType, callResult] = spy.results[nthCall - 1]
      const ordinalCall = `${ordinalOf(nthCall)} call`

      if (!isNot && callType === 'error')
        chai.assert.fail(`expected ${ordinalCall} to return #{exp}, but instead it threw an error`)

      const nthCallReturn = equals(callResult, value)

      this.assert(
        nthCallReturn,
        `expected ${ordinalCall} spy call to return #{exp}`,
        `expected ${ordinalCall} spy call to not return #{exp}`,
        value,
        callResult,
      )
    })
  }
}
