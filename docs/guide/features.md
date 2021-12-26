# Features

<FeaturesList class="!gap-1 text-lg" />

## Shared config between test, dev and build

Vite's config, transformers, resolvers, and plugins. Use the same setup from your app to run the tests

## Watch Mode

Smart & instant watch mode, [like HMR for tests!](https://twitter.com/antfu7/status/1468233216939245579)

```bash
$ vitest -w
```

Vitest smartly searches the module graph and only rerun the related tests (just like how HMR works in Vite!).

## Smooth integration with UI Frameworks

Components testing for Vue, React, Lit and more

## Common web idioms out-of-the-box

Out-of-box TypeScript / JSX support / PostCSS

## ESM first

ESM first, top level await

## Threads

Workers multi-threading via [tinypool](https://github.com/Aslemammad/tinypool) (a lightweight fork of [Piscina](https://github.com/piscinajs/piscina))

## Filtering

Filtering, timeouts, concurrent for suite and tests

### CLI

You can use CLI to filter test files by name:

```bash
$ vitest basic
```

Will only execute test files that contain `basic`, e.g.

```
basic.test.ts
basic-foo.test.ts
```

### Specifying a Timeout

You can optionally pass a timeout in milliseconds as third argument to tests. The default is 5 seconds.

```ts
test('name', async() => { ... }, 1000)
```

Hooks also can receive a timeout, with the same 5 seconds default.

```ts
beforeAll( async() => { ... }, 1000)
```

### Skipping suites and tests

Use `.skip` to avoid running certain suites or tests

```ts
describe.skip("skipped suite", () => {
  it("test", () => {
    // Suite skipped, no error
    assert.equal(Math.sqrt(4), 3);
  });
});

describe("suite", () => {
  it.skip("skipped test", () => {
    // Test skipped, no error
    assert.equal(Math.sqrt(4), 3);
  });
});
```

### Selecting suites and tests to run

Use `.only` to only run certain suites or tests

```ts
// Only this suite (and others marked with only) are run
describe.only("suite", () => {
  it("test", () => {
    assert.equal(Math.sqrt(4), 3);
  });
});

describe("another suite", () => {
  it("skipped test", () => {
    // Test skipped, as tests are running in Only mode
    assert.equal(Math.sqrt(4), 3);
  });

  it.only("test", () => {
    // Only this test (and others marked with only) are run
    assert.equal(Math.sqrt(4), 2);
  });
});
```

### Unimplemented suites and tests

Use `.todo` to stub suites and tests that should be implemented

```ts
// An entry will be shown in the report for this suite
describe.todo("unimplemented suite");

// An entry will be shown in the report for this test
describe("suite", () => {
  it.todo("unimplemented test");
});
```

## Running tests concurrently

Use `.concurrent` in consecutive tests to run them in parallel

```ts
// The two tests marked with concurrent will be run in parallel
describe("suite", () => {
  it("serial test", async() => { /* ... */ });
  it.concurrent("concurrent test 1", async() => { /* ... */ });
  it.concurrent("concurrent test 2", async() => { /* ... */ });
});
```

If you use `.concurrent` in a suite, every tests in it will be run in parallel

```ts
// All tests within this suite will be run in parallel
describe.concurrent("suite", () => {
  it("concurrent test 1", async() => { /* ... */ });
  it("concurrent test 2", async() => { /* ... */ });
  it.concurrent("concurrent test 3", async() => { /* ... */ });
});
```

You can also use `.skip`, `.only`, and `.todo` with concurrent suites and tests. Read more in the [API Reference](../api/#concurrent)

## Snaphot

[Jest Snapshot](https://jestjs.io/docs/snapshot-testing) support

## Chai and Jest expect compatibility

[Chai](https://www.chaijs.com/) built-in for assertions plus [Jest expect](https://jestjs.io/docs/expect) compatible APIs

## Mocking

[Tinyspy](https://github.com/Aslemammad/tinyspy) built-in for mocking with `jest` compatible APIs on `vi` object.

```ts
import { vi } from 'vitest'

const fn = vi.fn()

fn('hello', 1)

expect(vi.isMockFunction(fn)).toBe(true)
expect(fn.mock.calls[0]).toEqual(['hello', 1])

fn.mockImplementation((arg) => arg)

fn('world', 2)

expect(fn.mock.returns[1]).toBe('world')
```

Vitest supports both [happy-dom](https://github.com/capricorn86/happy-dom) or [jsdom](https://github.com/jsdom/jsdom) for mocking DOM and browser APIs. They don't come with Vitest, you might need to install them:

```bash
$ npm i -D happy-dom
# or
$ npm i -D jsdom
```

After that, change the `environment` option in your config file:

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'happy-dom' // or 'jsdom', 'node'
  }
})
```

## Coverage

Vitest supports Native code coverage via [c8](https://github.com/bcoe/c8)

```json
{
  "scripts": {
    "test": "vitest",
    "coverage": "vitest --coverage"
  }
}
```

To configure it, set `test.coverage` options in your config file:

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  }
})
```
