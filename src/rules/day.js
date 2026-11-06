import { busy } from "../board.js";
import { DAYS, LUNCH, MORNING } from "../time.js";

/**
 * One resource's day as a bitmask: bit i is set when the slot of index i in the day is taken. Every daily rule reads
 * it, without allocating.
 */
export function dayMask(layer, resource, week, day) {
  const { first, count } = DAYS[day];
  let mask = 0;
  for (let i = 0; i < count; i += 1) if (busy(layer, resource, week, first + i)) mask |= 1 << i;
  return mask;
}

export function popcount(mask) {
  let n = 0;
  for (let rest = mask; rest; rest &= rest - 1) n += 1;
  return n;
}

const bitsFrom = (from, to) => ((1 << to) - 1) & ~((1 << from) - 1);
export const LUNCH_MASK = LUNCH.reduce((mask, i) => mask | (1 << i), 0);
export const MORNING_MASK = bitsFrom(0, MORNING);
/** The afternoon bits of `day`. */
export const afternoonMask = (day) => bitsFrom(MORNING, DAYS[day].count);

/** The free bits between the first and the last taken one, within `[from, to)`. */
export function innerFree(mask, from, to) {
  const part = mask & bitsFrom(from, to);
  if (!part) return 0;
  const low = 31 - Math.clz32(part & -part);
  const high = 31 - Math.clz32(part);
  return bitsFrom(low, high + 1) & ~part;
}

const [ELEVEN, NOON, ONE] = LUNCH.map((i) => 1 << i);

/** Whether two consecutive free slots remain in the lunch window, 11 h to 14 h (D5). */
export function breakKept(mask) {
  return !(mask & (ELEVEN | NOON)) || !(mask & (NOON | ONE));
}
