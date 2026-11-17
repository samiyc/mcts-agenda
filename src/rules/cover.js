import { busy } from "../board.js";
import { indexOf } from "../school/index.js";
import { SLOTS, WEEKS, weeksOf } from "../time.js";

/**
 * S9, the cover (docs/modele.md § 3.2, J10): at a slot of a week, the hours of a discipline that no colleague of the
 * discipline could take, every teacher of it there being in class (those elsewhere, D4, do not count). A timetable
 * low in S9 leaves, at most hours, a colleague free to replace an absent teacher. A discipline with one teacher counts
 * all its hours whatever the timetable. Read off the board as it stands; nothing allocates.
 */

/** The hours of discipline `x` at `slot` on `week` that no free colleague of it could take: 0 when one is free. */
export function uncovered(board, x, week, slot) {
  const { teachers } = board.school;
  const ids = indexOf(board.school).teachersOf[x];
  let hours = 0;
  for (let i = 0; i < ids.length; i += 1) {
    if (teachers[ids[i]].unavailable[slot]) continue;
    if (!busy(board.teacher, ids[i], week, slot)) return 0;
    hours += 1;
  }
  return hours;
}

/** S9 on the cells of its discipline that `course` takes from `slot` on `week`, those not yet seen this epoch. */
function courseCover(board, course, week, slot) {
  const { seen } = board;
  const x = indexOf(board.school).disciplineOf[course.teacher];
  let hours = 0;
  for (let k = 0; k < course.length; k += 1) {
    const index = (x * WEEKS + week) * SLOTS + slot + k;
    if (seen.cover[index] === seen.epoch) continue;
    seen.cover[index] = seen.epoch;
    hours += uncovered(board, x, week, slot + k);
  }
  return hours;
}

/** S9 on the cells the courses of `link` take from `slot`, each cell of a discipline counted once. */
export function coverCost(board, link, slot) {
  const { school } = board;
  const ids = school.links[link];
  board.seen.epoch += 1;
  let hours = 0;
  for (let i = 0; i < ids.length; i += 1) {
    const course = school.courses[ids[i]];
    const weeks = weeksOf(course.weeks);
    for (let w = 0; w < weeks.length; w += 1) hours += courseCover(board, course, weeks[w], slot);
  }
  return hours;
}

/** S9 over the whole timetable: every discipline, week and slot. */
export function countCover(board) {
  const disciplines = indexOf(board.school).teachersOf.length;
  let hours = 0;
  for (let x = 0; x < disciplines; x += 1) {
    for (let week = 0; week < WEEKS; week += 1) for (let slot = 0; slot < SLOTS; slot += 1) hours += uncovered(board, x, week, slot);
  }
  return hours;
}
