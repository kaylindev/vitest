import { expect, test } from 'vitest'

test('snapshot', () => {
  expect({
    this: { is: new Set(['of ', 'snapshot']) },
  }).toMatchSnapshot()
})
