import { RollingCounter } from '../src'

const sleep = (n: number) => new Promise((r) => setTimeout(r, n))

it('should work well', async () => {
  const rc = new RollingCounter({ window: 1000, windowSize: 4 })

  expect(rc.getCounter()).toBe(0)
  for (let i = 0; i < 10; i++) {
    rc.add(1)
    expect(rc.getCounter()).toBe(Math.min(i + 1, 4))
    expect(rc.getCounterArray()).toStrictEqual(
      i >= 4
        ? [1, 1, 1, 1]
        : Array(4)
            .fill(0)
            .map((_, ii) => (ii <= i ? 1 : 0))
    )
    await sleep(250)
  }
})

it('add multi times per duration window should work well', async () => {
  const rc = new RollingCounter({ window: 1000, windowSize: 4 })

  expect(rc.getCounter()).toBe(0)
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 100; j++) {
      rc.add(1)
    }
    expect(rc.getCounter()).toBe(Math.min((i + 1) * 100, 400))
    expect(rc.getCounterArray()).toStrictEqual(
      i >= 4
        ? [100, 100, 100, 100]
        : Array(4)
            .fill(0)
            .map((_, ii) => (ii <= i ? 100 : 0))
    )
    await sleep(250)
  }
})

it('expire should should work well', async () => {
  const rc = new RollingCounter({ window: 1000, windowSize: 10 })

  expect(rc.getCounter()).toBe(0)
  for (let i = 0; i < 10; i++) {
    rc.add(1)
    await sleep(100)
  }

  for (let i = 0; i < 10; i++) {
    expect(rc.getCounter()).toBe(10 - i - 1)
    expect(rc.getCounterArray()).toStrictEqual(
      Array(10)
        .fill(1)
        .map((_, ii) => (ii <= i ? 0 : 1))
    )
    await sleep(100)
  }
})

it('skip full window should work well', async () => {
  const rc = new RollingCounter({ window: 1000, windowSize: 10 })

  const expected = Array(10)
    .fill(0)
    .map((_, i) => (i === 0 ? 1 : 0))

  expect(rc.getCounter()).toBe(0)
  rc.add(1)
  expect(rc.getCounter()).toBe(1)
  expect(rc.getCounterArray()).toStrictEqual(expected)

  await sleep(1000)

  rc.add(1)
  expect(rc.getCounter()).toBe(1)
  expect(rc.getCounterArray()).toStrictEqual(expected)

  await sleep(1000)
  expect(rc.getCounter()).toBe(0)
  expect(rc.getCounterArray()).toStrictEqual(Array(10).fill(0))
})
