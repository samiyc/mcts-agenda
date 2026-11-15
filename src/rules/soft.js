import { place, remove } from "../board.js";
import { DISCIPLINES } from "../grid.js";
import { indexOf } from "../school/index.js";
import { DAYS, LATE, WEEKS, dayOf, hourOf, indexInDay, weeksOf } from "../time.js";
import { LUNCH_MASK, MORNING_MASK, afternoonMask, dayMask, innerFree, popcount } from "./day.js";
import { divisionDay } from "./division.js";

/**
 * The soft constraints S1 to S8 (docs/modele.md § 3.2), each counted where it lives: a division's day
 * (`division.js`), a teacher's day, a course, a division's week of EPS. The weights are hypotheses (Q-P1, Q-P2).
 * `linkDelta` is what the greedy reads: the cost a barrette adds, from the days it touches only.
 */
export const WEIGHTS = Object.freeze({ S1: 10, S2: 3, S3: 5, S4: 4, S5: 10, S6: 1, S7: 1, S8: 3 });
/** The weights a collège is judged by: the sandbox's when it changes them (src/sandbox/edits.js), else `WEIGHTS`. */
export const weightsOf = (school) => school.weights ?? WEIGHTS;
/** Free slots of a teacher's lunch that are not holes. */
const LUNCH_ALLOWANCE = 2;
const HOURS_APART = 24;

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

/** S3 too: the hours of the day the teacher gives on slots he would rather keep free (the sandbox's `avoid`). */
export function avoidedHours(teacher, mask, day) {
  if (!teacher.avoid) return 0;
  const { first, count } = DAYS[day];
  let hours = 0;
  for (let i = 0; i < count; i += 1) if (teacher.avoid[first + i] && mask & (1 << i)) hours += 1;
  return hours;
}

/** S3: the wish broken, and the avoided hours given. */
export const wishCount = (teacher, mask, day) => wishBroken(teacher, mask, day) + avoidedHours(teacher, mask, day);

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

/** S7: 1 when a course that has a home room is elsewhere. */
export const awayFromHome = (course, room) => (course.home >= 0 && room !== course.home ? 1 : 0);

function divisionDayCost(board, division, week, day) {
  const counts = divisionDay(board, division, week, day);
  const w = weightsOf(board.school);
  return w.S1 * counts.holes + w.S4 * counts.repeats + w.S5 * counts.long;
}

function teacherDayCost(board, teacher, week, day) {
  const mask = dayMask(board.teacher, teacher, week, day);
  const w = weightsOf(board.school);
  return w.S2 * teacherHoles(mask, day) + w.S3 * wishCount(board.school.teachers[teacher], mask, day);
}

/** Marks a resource's week seen in this epoch; true the first time. */
function firstVisit(stamps, index, epoch) {
  if (stamps[index] === epoch) return false;
  stamps[index] = epoch;
  return true;
}

/** The cost of a course's days on a week that no course before it in the epoch has counted. */
function weekCost(board, course, week, day) {
  const { seen } = board;
  let cost = 0;
  for (let d = 0; d < course.divisions.length; d += 1) {
    const division = course.divisions[d];
    if (!firstVisit(seen.division, division * WEEKS + week, seen.epoch)) continue;
    cost += divisionDayCost(board, division, week, day);
    if (course.discipline === "eps") cost += weightsOf(board.school).S8 * epsTooClose(board, division, week);
  }
  if (firstVisit(seen.teacher, course.teacher * WEEKS + week, seen.epoch)) cost += teacherDayCost(board, course.teacher, week, day);
  return cost;
}

/** The cost of the days the courses of `link` on `day` touch, each division's and teacher's day once. */
function localCost(board, link, day) {
  board.seen.epoch += 1;
  let cost = 0;
  const ids = board.school.links[link];
  for (let i = 0; i < ids.length; i += 1) {
    const course = board.school.courses[ids[i]];
    const weeks = weeksOf(course.weeks);
    for (let w = 0; w < weeks.length; w += 1) cost += weekCost(board, course, weeks[w], day);
  }
  return cost;
}

/** What a course costs on its own, wherever the others are: S6 and S7, on each of its weeks. */
const ownCost = (course, slot, room, w) => (w.S6 * lateHeavy(course, slot) + w.S7 * awayFromHome(course, room)) * weeksOf(course.weeks).length;

/** The soft cost that placing link `link` at `slot`, in the rooms of `board.rooms`, adds; the board is left as it was. */
export function linkDelta(board, link, slot) {
  const ids = board.school.links[link];
  const day = dayOf(slot);
  const before = localCost(board, link, day);
  let own = 0;
  for (let i = 0; i < ids.length; i += 1) {
    place(board, ids[i], slot, board.rooms[i]);
    own += ownCost(board.school.courses[ids[i]], slot, board.rooms[i], weightsOf(board.school));
  }
  const after = localCost(board, link, day);
  for (let i = 0; i < ids.length; i += 1) remove(board, ids[i]);
  return after - before + own;
}

/** The same for one course alone in its link, at `slot` in `room`. */
export function deltaOf(board, id, slot, room) {
  board.rooms[0] = room;
  return linkDelta(board, board.school.courses[id].link, slot);
}
