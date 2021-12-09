#!/usr/bin/env node

import { fileURLToPath } from 'url'
import { resolve } from 'path'

// TODO: enable source map when public
// import { install } from 'source-map-support'
// install({ environment: 'node', hookRequire: true })

const argv = process.argv.slice(2)
const filename = fileURLToPath(import.meta.url)
const entry = resolve(filename, '../../dist/node/cli.js')

if (argv.includes('--coverage')) {
  process.argv.splice(2, 0, process.argv[0], entry)
  await import('c8/bin/c8.js')
}
else {
  await import('../dist/node/cli.js')
}
