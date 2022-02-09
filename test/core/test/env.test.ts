import { expect, test } from 'vitest'
import { getAuthToken } from '../src/env'

test('can reassign env locally', () => {
  import.meta.env.VITEST_ENV = 'TEST'
  expect(import.meta.env.VITEST_ENV).toBe('TEST')
})

test('can reassign env everywhere', () => {
  import.meta.env.AUTH_TOKEN = '123'
  expect(getAuthToken()).toBe('123')
  process.env.AUTH_TOKEN = '321'
  expect(getAuthToken()).toBe('321')
})

test('can see env in "define"', () => {
  expect(import.meta.env.TEST_NAME).toBe('hello world')
  expect(process.env.TEST_NAME).toBe('hello world')
})
