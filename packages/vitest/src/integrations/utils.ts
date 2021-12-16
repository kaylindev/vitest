import { FakeTimers } from './timers'
import { spyOn, fn } from './jest-mock'

class VitestUtils {
  spyOn = spyOn
  fn = fn
  mock = (path: string) => path

  private _timers: FakeTimers

  constructor() {
    this._timers = new FakeTimers()
  }

  public useFakeTimers() {
    return this._timers.useFakeTimers()
  }

  public useRealTimers() {
    return this._timers.useRealTimers()
  }

  public runOnlyPendingTimers() {
    return this._timers.runOnlyPendingTimers()
  }

  public runAllTimers() {
    return this._timers.runAllTimers()
  }

  public advanceTimersByTime(ms: number) {
    return this._timers.advanceTimersByTime(ms)
  }

  public advanceTimersToNextTimer() {
    return this._timers.advanceTimersToNextTimer()
  }

  public runAllTicks() {
    return this._timers.runAllTicks()
  }

  public setSystemTime(time?: number | Date) {
    return this._timers.setSystemTime(time)
  }

  public getRealSystemTime() {
    return this._timers.getRealSystemTime()
  }

  public getTimerCount() {
    return this._timers.getTimerCount()
  }
}

export const vitest = new VitestUtils()
export const vi = vitest
