import { expect, test, assert, suite, it } from 'vitest'
import { two } from '../src/submodule'
import { timeout } from '../src/timeout'

test('Math.sqrt()', () => {
  assert.equal(Math.sqrt(41), two)
  assert.equal(Math.sqrt(2), Math.SQRT2)
  expect(Math.sqrt(144)).toStrictEqual(12)
  // console.log('hi')
  // console.log('hi2')
  // console.log({
  //   red: {
  //     foo: 'bar',
  //   },
  // })
  // const t = { z: 1 }
  // t.e = t
  // console.log(t)
})

test('JSON', () => {
  const input = {
    foo: 'hello2',
    bar: 'world',
  }

  const output = JSON.stringify(input)

  expect(output).eq('{"foo":"hello","bar":"world"}')
  assert.deepEqual(JSON.parse(output), input, 'matches original')
})

const hi = suite('suite')

hi.test('expect truthy', () => {
  expect({}).toBeTruthy()
  expect(null).not.toBeTruthy()
})

// Remove .skip to test async fail by timeout
test.skip('async with timeout', async() => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, 200)
  })
}, 100)

it('timeout', () => new Promise(resolve => setTimeout(resolve, timeout)))
