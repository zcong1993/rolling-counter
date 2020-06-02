import * as debug from 'debug'
import { Hrtime, hrtime2nano, ms2nano } from './utils'

const db = debug('rolling-counter')

export interface Opt {
  window: number // ms, full time window
  windowSize: number // window split bucket size
}

export class RollingCounter {
  private windowDuration: number
  private lastUpdatedAt: Hrtime
  private startTime: Hrtime
  private buffer: number[]
  private opt: Opt

  constructor(c: Opt) {
    this.opt = {
      window: ms2nano(c.window),
      windowSize: c.windowSize,
    }
    this.windowDuration = this.opt.window / this.opt.windowSize
    this.lastUpdatedAt = process.hrtime()
    this.startTime = process.hrtime()

    this.buffer = Array(this.opt.windowSize).fill(0)
    db(this)
  }

  add(d: number) {
    this.dropExpired()
    const o = this.offset()
    this.buffer[this.mapIndex(o)] += d

    db(`index: ${o}, ${this.mapIndex(o)}`)
    this.updatelastUpdatedAt()
  }

  getCounter() {
    this.dropExpired()
    return this.buffer.reduce((prev, acc) => (prev += acc), 0)
  }

  getCounterArray() {
    this.dropExpired()
    return [...this.buffer]
  }

  private dropExpired() {
    const duration = hrtime2nano(process.hrtime(this.lastUpdatedAt))
    const offset = this.offset()
    const lastOffset = this.lastOffset()
    db(`duration: ${duration}`)
    // reset all
    if (duration > this.opt.window) {
      db('reset all')
      for (let i = 0; i < this.opt.windowSize; i++) {
        this.buffer[i] = 0
      }
      return
    }

    const left = offset - this.opt.windowSize
    const lastLeft = lastOffset - this.opt.windowSize
    db(`${lastOffset}, ${offset}, clean: [${lastLeft + 1}, ${left}]`)
    for (let i = lastLeft + 1; i <= left; i++) {
      const mappedIndex = this.mapIndex(i)
      if (mappedIndex >= 0) {
        this.buffer[mappedIndex] = 0
      }
    }
  }

  private updatelastUpdatedAt() {
    this.lastUpdatedAt = process.hrtime()
  }

  private lastOffset() {
    const o = Math.floor(
      (hrtime2nano(this.lastUpdatedAt) - hrtime2nano(this.startTime)) /
        this.windowDuration
    )
    return o
  }

  private offset() {
    const diff = hrtime2nano(process.hrtime(this.startTime))
    const o = Math.floor(diff / this.windowDuration)
    return o
  }

  private mapIndex(i: number) {
    return i % this.opt.windowSize
  }
}
