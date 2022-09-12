class Interval {
  id; 

  set(fn: Function, interval: number) {
    this.id = setInterval(fn, interval)
  }

  clear() {
    clearInterval(this.id)
  }
}

export const RefreshTimer = new Interval();