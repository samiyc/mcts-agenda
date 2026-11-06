import { courseAt, place, remove } from "../board.js";
import { DISCIPLINES } from "../grid.js";
import { DISCIPLINE_INDEX, indexOf } from "../school/index.js";
import { DAYS, LATE, MORNING, dayOf, hourOf, indexInDay, weeksOf } from "../time.js";
import { LUNCH_MASK, MORNING_MASK, afternoonMask, dayMask, innerFree, popcount } from "./day.js";

/**
 * The soft constraints S1 to S8 (docs/modele.md § 3.2), each counted where it lives: a division's day, a teacher's
 * day, a course, a division's week of EPS. The weights are hypotheses (Q-P1, Q-P2). `deltaOf` is what the greedy
 * reads: the cost a placement adds, from the days it touches only.
 */
export const WEIGHTS = Object.freeze({ S1: 10, S2: 3, S3: 5, S4: 4, S5: 10, S6: 1, S7: 1, S8: 3 });
/** The most hours of a cycle 4 pupil's day before S5 counts. */
export const CYCLE_4_DAY = 7;
/** Free slots of a teacher's lunch that are not holes. */
const LUNCH_ALLOWANCE = 2;
const HOURS_APART = 24;

/** S1: a division's free slots inside a half-day, between two courses. */
export const divisionHoles = (mask, day) =>
  popcount(innerFree(mask, 0, MORNING)) + popcount(innerFree(mask, MORNING, DAYS[day].count));

/** S5: a cycle 4 day's hours beyond seven. */
export const longDay = (mask, level) => (level === 6 ? 0 : Math.max(0, popcount(mask) - CYCLE_4_DAY));

/** S2: a teacher's free slots between the first and the last course of the day, two of the lunch window excepted. */
export function teacherHoles(mask, day) {
  const inner = innerFree(mask, 0, DAYS[day].count);
  return popcount(inner) - Math.min(LUNCH_ALLOWANCE, popcount(inner & LUNCH_MASK));
}

/** S3: 1 when the teacher's wished half-day holds a course. */
export function wishBroken(teacher, mask, day) {
  if (!teacher.wish || teacher.wish.day !== day) return 0;
  const half = teacher.wish.half === 0 ? MORNING_MASK : afternoonMask(day);
  return mask & half ? 1 : 0;
}

const seen = new Uint8Array(Object.keys(DISCIPLINES).length);

/** S4: a discipline's courses beyond the first in a division's day; a block counts once. */
export function repeats(board, division, week, day) {
  const { first, count } = DAYS[day];
  seen.fill(0);
  let extra = 0;
  let previous = -1;
  for (let i = 0; i < count; i += 1) {
    const id = courseAt(board.division, division, week, first + i);
    if (id >= 0 && id !== previous) {
      const k = DISCIPLINE_INDEX[board.school.courses[id].discipline];
      if (seen[k]) extra += 1;
      seen[k] = 1;
    }
    previous = id;
  }
  return extra;
}

const startHour = (slot) => dayOf(slot) * HOURS_APART + hourOf(slot);
const onWeek = (board, id, week) => board.slot[id] >= 0 && weeksOf(board.school.courses[id].weeks).includes(week);

/** S8: pairs of a division's EPS sessions less than 24 h apart in a week. */
export function epsTooClose(board, division, week) {
  const eps = indexOf(board.school).eps[division];
  let pairs = 0;
  for (let i = 0; i < eps.length; i += 1) {
    if (!onWeek(board, eps[i], week)) continue;
    for (let j = i + 1; j < eps.length; j += 1) {
      if (onWeek(board, eps[j], week) && Math.abs(startHour(board.slot[eps[i]]) - startHour(board.slot[eps[j]])) < HOURS_APART) pairs += 1;
    }
  }
  return pairs;
}

/** S6: 1 when a heavy discipline runs at or after 15 h. */
export function lateHeavy(course, slot) {
  return DISCIPLINES[course.discipline].heavy && indexInDay(slot + course.length - 1) >= LATE ? 1 : 0;
}

/** S7: 1 when an ordinary course is out of its division's home room. */
export const awayFromHome = (school, course, room) =>
  course.kind === "ordinary" && room !== school.divisions[course.division].homeRoom ? 1 : 0;

function divisionDayCost(board, division, week, day) {
  const mask = dayMask(board.division, division, week, day);
  const level = board.school.divisions[division].level;
  return WEIGHTS.S1 * divisionHoles(mask, day) + WEIGHTS.S4 * repeats(board, division, week, day) + WEIGHTS.S5 * longDay(mask, level);
}

function teacherDayCost(board, teacher, week, day) {
  const mask = dayMask(board.teacher, teacher, week, day);
  return WEIGHTS.S2 * teacherHoles(mask, day) + WEIGHTS.S3 * wishBroken(board.school.teachers[teacher], mask, day);
}

/** The cost of the days a course of `course` on `day` touches. */
function localCost(board, course, day) {
  let cost = 0;
  for (const week of weeksOf(course.weeks)) {
    cost += divisionDayCost(board, course.division, week, day) + teacherDayCost(board, course.teacher, week, day);
    if (course.discipline === "eps") cost += WEIGHTS.S8 * epsTooClose(board, course.division, week);
  }
  return cost;
}

/** The soft cost that placing course `id` at `slot` in `room` adds; the board is left as it was. */
export function deltaOf(board, id, slot, room) {
  const course = board.school.courses[id];
  const day = dayOf(slot);
  const before = localCost(board, course, day);
  place(board, id, slot, room);
  const after = localCost(board, course, day);
  remove(board, id);
  const own = WEIGHTS.S6 * lateHeavy(course, slot) + WEIGHTS.S7 * awayFromHome(board.school, course, room);
  return after - before + own * weeksOf(course.weeks).length;
}
