# Mocking

## Mocking functions

Mock functions (or "spies") observe functions, that are invoked in some other code, allowing you to test its arguments, output or even redeclare its implementation.

We use [Tinyspy](https://github.com/Aslemammad/tinyspy) as a base for mocking functions, but we have our own wrapper to make it `jest` compatible.

Both `vi.fn()` and `vi.spyOn()` share the same methods, but the return result of `vi.fn()` is callable.

### vi.fn

**Type:** `(fn: Function) => CallableMockInstance`

Creates a spy on a function, though can be initiated without one. Every time a function is invoked, it stores its call arguments, returns and instances. Also, you can manipulate its behavior with [methods](#mockmethods).
If no function is given, mock will return `undefined`, when invoked.

```ts
const getApples = vi.fn(() => 0)

getApples()

expect(getApples).toHaveBeenCalled()
expect(getApples).toHaveReturnedWith(0)

getApples.mockReturnOnce(5)

const res = getApples()
expect(res).toBe(5)
expect(getApples).toHaveReturnedNthTimeWith(1, 5)
```

### vi.spyOn

**Type:** `<T, K extends keyof T>(object: T, method: K, accessType?: 'get' | 'set') => MockInstance`

Creates a spy on a method or getter/setter of an object.

```ts
let apples = 0
const obj = {
  getApples: () => 13,
}

const spy = vi.spyOn(obj, 'getApples').mockImplementation(() => apples)
apples = 1

expect(obj.getApples()).toBe(1)

expect(spy).toHaveBeenCalled()
expect(spy).toHaveReturnedWith(1)
```

## Mock methods

### mockName

**Type:** `(name: string) => MockInstance`

Sets internal mock name. Useful to see what mock has failed the assertion.

### getMockName

**Type:** `() => string`

Use it to return the name given to mock with method `.mockName(name)`.

### mockClear

**Type:** `() => MockInstance`

Clears all information about every call. After calling it, [`spy.mock.calls`](#mockcalls), [`spy.mock.returns`](#mockreturns) will return empty arrays. It is useful if you need to clean up spy between different assertions.

If you want this method to be called before each test automatically, you can enable [`clearMocks`](/config/#clearMocks) setting in config.

### mockReset

**Type:** `() => MockInstance`

Does what `mockClear` does and makes inner implementation as an empty function (returning `undefined`, when invoked). This is useful when you want to completely reset a mock back to its initial state.

If you want this method to be called before each test automatically, you can enable [`mockReset`](/config/#mockReset) setting in config.

### mockRestore

**Type:** `() => MockInstance`

Does what `mockRestore` does and restores inner implementation to the original function.

Note that restoring mock from `vi.fn()` will set implementation to an empty function that returns `undefined`. Restoring a `vi.fn(impl)` will restore implementation to `impl`.

If you want this method to be called before each test automatically, you can enable [`restoreMocks`](/config/#restoreMocks) setting in config.

### mockImplementation

**Type:** `(fn: Function) => MockInstance`

Accepts a function that will be used as an implementation of the mock.

For example:

```ts
const mockFn = jest.fn().mockImplementation(apples => apples + 1);
// or: jest.fn(apples => apples + 1);

const NelliesBucket = mockFn(0);
const BobsBucket = mockFn(1);

NelliesBucket === 1; // true
BobsBucket === 2; // true

mockFn.mock.calls[0][0] === 0; // true
mockFn.mock.calls[1][0] === 1; // true
```

### mockImplementationOnce

**Type:** `(fn: Function) => MockInstance`

Accepts a function that will be used as an implementation of the mock for one call to the mocked function. Can be chained so that multiple function calls produce different results.

```ts
const myMockFn = jest
  .fn()
  .mockImplementationOnce(() => true)
  .mockImplementationOnce(() => false);

myMockFn(); // true
myMockFn(); // false
```

When the mocked function runs out of implementations, it will invoke the default implementation that was set with `jest.fn(() => defaultValue)` or `.mockImplementation(() => defaultValue)` if they were called:

```ts
const myMockFn = jest
  .fn(() => 'default')
  .mockImplementationOnce(() => 'first call')
  .mockImplementationOnce(() => 'second call');

// 'first call', 'second call', 'default', 'default'
console.log(myMockFn(), myMockFn(), myMockFn(), myMockFn());
```

### mockReturnThis

**Type:** `() => MockInstance`

Sets inner implementation to return `this` context.

### mockReturnValue

**Type:** `(value: any) => MockInstance`

Accepts a value that will be returned whenever the mock function is called.

```ts
const mock = jest.fn();
mock.mockReturnValue(42);
mock(); // 42
mock.mockReturnValue(43);
mock(); // 43
```

### mockReturnValueOnce

**Type:** `(value: any) => MockInstance`

Accepts a value that will be returned whenever mock function is invoked. If chained, every consecutive call will return passed value. When there are no more `mockReturnValueOnce` values to use, calls a function specified by `mockImplementation` or other `mockReturn*` methods.

```ts
const myMockFn = jest
  .fn()
  .mockReturnValue('default')
  .mockReturnValueOnce('first call')
  .mockReturnValueOnce('second call');

// 'first call', 'second call', 'default', 'default'
console.log(myMockFn(), myMockFn(), myMockFn(), myMockFn());
```

### mockResolvedValue

**Type:** `(value: any) => MockInstance`

Accepts a value that will be resolved, when async function will be called.

```ts
test('async test', async () => {
  const asyncMock = jest.fn().mockResolvedValue(43);

  await asyncMock(); // 43
});
```

### mockResolvedValueOnce

**Type:** `(value: any) => MockInstance`

Accepts a value that will be resolved for one call to the mock function. If chained, every consecutive call will resolve passed value.

```ts
test('async test', async () => {
  const asyncMock = jest
    .fn()
    .mockResolvedValue('default')
    .mockResolvedValueOnce('first call')
    .mockResolvedValueOnce('second call');

  await asyncMock(); // first call
  await asyncMock(); // second call
  await asyncMock(); // default
  await asyncMock(); // default
});
```

### mockRejectedValue

**Type:** `(value: any) => MockInstance`

Accepts an error that will be rejected, when async function will be called.

```ts
test('async test', async () => {
  const asyncMock = jest.fn().mockRejectedValue(new Error('Async error'));

  await asyncMock(); // throws "Async error"
});
```

### mockRejectedValueOnce

**Type:** `(value: any) => MockInstance`

Accepts a value that will be rejected for one call to the mock function. If chained, every consecutive call will reject passed value.

```ts
test('async test', async () => {
  const asyncMock = jest
    .fn()
    .mockResolvedValueOnce('first call')
    .mockRejectedValueOnce(new Error('Async error'));

  await asyncMock(); // first call
  await asyncMock(); // throws "Async error"
});
```

## Mock properties

### mock.calls

This is an array containing all arguments for each call. One item of the array is arguments of that call.

If a function was invoked twice with the following arguments `fn(arg1, arg2)`, `fn(arg3, arg4)` in that order, then `mock.calls` will be:

```js
[
  ['arg1', 'arg2'],
  ['arg3', 'arg4'],
];
```

### mock.results

This is an array containing all values, that were `returned` from function. One item of the array is an object with properties `type` and `value`. Available types are:

- `'return'` - function returned without throwing.
- `'throw'` - function threw a value.

The `value` property contains returned value or thrown error.

If function returned `'result1`, then threw and error, then `mock.results` will be:

```js
[
  {
    type: 'return',
    value: 'result',
  },
  {
    type: 'throw',
    value: Error,
  },
];
```

### mock.instances

Currently, this property is not implemented.

## See also

- [Jest's Mock Functions](https://jestjs.io/docs/mock-function-api)