import { format } from 'util'
import { stringify } from '../integrations/chai/jest-matcher-utils'

// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
export function serializeError(val: any): any {
  if (!val || typeof val === 'string')
    return val

  if (typeof val === 'function')
    return `Function<${val.name}>`
  if (typeof val !== 'object')
    return val
  if (val instanceof Promise || 'then' in val || (val.constructor && val.constructor.prototype === 'AsyncFunction'))
    return 'Promise'
  if (typeof Element !== 'undefined' && val instanceof Element)
    return val.tagName

  if (typeof val.asymmetricMatch === 'function')
    return `${val.toString()} ${format(val.sample)}`

  Object.keys(val).forEach((key) => {
    val[key] = serializeError(val[key])
  })

  return val
}

export function processError(err: any) {
  if (!err)
    return err
  // stack is not serialized in worker communication
  // we stringify it first
  if (err.stack)
    err.stackStr = String(err.stack)
  if (err.name)
    err.nameStr = String(err.name)

  if (typeof err.expected !== 'string')
    err.expected = stringify(err.expected)
  if (typeof err.actual !== 'string')
    err.actual = stringify(err.actual)

  return serializeError(err)
}
