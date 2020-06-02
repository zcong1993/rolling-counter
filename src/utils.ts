export type Hrtime = [number, number]

export const hrtime2nano = (hrtime: Hrtime): number =>
  hrtime[0] * 1e9 + hrtime[1]

export const ms2nano = (t: number): number => t * 1e6
