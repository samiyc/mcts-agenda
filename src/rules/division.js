import { courseAt } from "../board.js";
import { DISCIPLINE_INDEX, DISCIPLINE_KEYS, PARTS, partOf } from "../school/index.js";
import { DAYS, MORNING, hasLunch } from "../time.js";
import { breakKept, dayMask, innerFree, popcount } from "./day.js";

/**
 * A division's day, as its pupils live it (docs/modele.md § 3): the lunch break (D5), the 6e's six hours (D6), the
 * holes (S1), a discipline twice (S4), the long cycle 4 day (S5). A half-group leaves the other half elsewhere, so each
 * half of the division is read on its own, and the day counts the worse of the two.
 */
/** The most hours of a 6e pupil's day (D6). */
export const SIXIEME_DAY = 6;
/** The most hours of a cycle 4 pupil's day before S5 counts. */
export const CYCLE_4_DAY = 7;

/** S1: a division's free slots inside a half-day, between two courses. */
export const divisionHoles = (mask, day) =>
  popcount(innerFree(mask, 0, MORNING)) + popcount(innerFree(mask, MORNING, DAYS[day].count));

/** S5: a cycle 4 day's hours beyond seven. */
export const longDay = (mask, level) => (level === 6 ? 0 : Math.max(0, popcount(mask) - CYCLE_4_DAY));

/** D6: a 6e day's hours beyond six. */
export const sixiemeExcess = (mask, level) => (level === 6 ? Math.max(0, popcount(mask) - SIXIEME_DAY) : 0);

const seen = new Uint8Array(DISCIPLINE_KEYS.length);

/** S4: a discipline's courses beyond the first in the day of a part of a division; a block counts once. */
export function repeats(board, part, week, day) {
  const { first, count } = DAYS[day];
  seen.fill(0);
  let extra = 0;
  let previous = -1;
  for (let i = 0; i < count; i += 1) {
    const id = courseAt(board.division, part, week, first + i);
    if (id >= 0 && id !== previous) {
      const k = DISCIPLINE_INDEX[board.school.courses[id].discipline];
      if (seen[k]) extra += 1;
      seen[k] = 1;
    }
    previous = id;
  }
  return extra;
}

/** The counts of one day, the worse half each; one object, overwritten by the next call. */
const DAY = { pause: 0, excess: 0, holes: 0, repeats: 0, long: 0 };

export function divisionDay(board, division, week, day) {
  const { level } = board.school.divisions[division];
  DAY.pause = 0;
  DAY.excess = 0;
  DAY.holes = 0;
  DAY.repeats = 0;
  DAY.long = 0;
  for (let half = 0; half < PARTS; half += 1) {
    const part = partOf(division, half);
    const mask = dayMask(board.division, part, week, day);
    if (hasLunch(day) && !breakKept(mask)) DAY.pause = 1;
    DAY.excess = Math.max(DAY.excess, sixiemeExcess(mask, level));
    DAY.holes = Math.max(DAY.holes, divisionHoles(mask, day));
    DAY.repeats = Math.max(DAY.repeats, repeats(board, part, week, day));
    DAY.long = Math.max(DAY.long, longDay(mask, level));
  }
  return DAY;
}
