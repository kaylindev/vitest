import { expect, test, assert, suite } from 'vitest'
import { two } from '../src/submodule'

test('Math.sqrt()', () => {
  assert.equal(Math.sqrt(4), two)
  assert.equal(Math.sqrt(2), Math.SQRT2)
  expect(Math.sqrt(144)).toStrictEqual(12)
})

test('JSON', () => {
  const input = {
    foo: 'hello',
    bar: 'world',
  }

  const output = JSON.stringify(input)

  expect(output).eq('{"foo":"hello","bar":"world"}')
  assert.deepEqual(JSON.parse(output), input, 'matches original')
})

test('async', async() => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, 100)
  })
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
