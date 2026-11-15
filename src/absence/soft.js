import { divisionHoles, longDay } from "../rules/division.js";
import { awayFromHome, lateHeavy, teacherHoles, weightsOf, wishCount } from "../rules/soft.js";
import { DISCIPLINE_INDEX, DISCIPLINE_KEYS, PARTS, partOf } from "../school/index.js";
import { DAYS, SLOTS, dayOf, hourOf } from "../time.js";
import { absentOn } from "./plan.js";

/**
 * The soft cost of a replanned week (docs/modele.md § 4, the third criterion of the score): the evaluator's S1 to S8
 * (§ 3.2), read on the sessions where they now stand. A teacher's day does not count on a day he is away. On a plan
 * with no absence, weeks A and B add up to the evaluator's cost (tests/absence.test.js).
 *
 * `areaCost` reads only what a move of one session touches (its divisions' and its teachers' days, before and after),
 * so that the search prices a move without allocating: the area after minus the area before is the move's price.
 */
const HOURS_APART = 24;
const seen = new Uint8Array(DISCIPLINE_KEYS.length);
const EPS = new WeakMap();

/** A resource's day in a layer of `SLOTS` cells a resource, as a bitmask. */
function maskOf(layer, resource, day) {
  const { first, count } = DAYS[day];
  let mask = 0;
  for (let i = 0; i < count; i += 1) if (layer[resource * SLOTS + first + i] > 0) mask |= 1 << i;
  return mask;
}

/** S4 on a part's day: a discipline's sessions beyond the first; a block counts once. */
function repeatsOf(plan, part, day) {
  const { first, count } = DAYS[day];
  seen.fill(0);
  let extra = 0;
  let previous = -1;
  for (let i = 0; i < count; i += 1) {
    const s = plan.at[part * SLOTS + first + i];
    if (s >= 0 && s !== previous) {
      const k = DISCIPLINE_INDEX[plan.school.courses[plan.course[s]].discipline];
      extra += seen[k];
      seen[k] = 1;
    }
    previous = s;
  }
  return extra;
}

/** S1, S4, S5 of a division's day, the worse half each, as the evaluator counts them. */
function divisionCost(plan, division, day) {
  const { level } = plan.school.divisions[division];
  let holes = 0;
  let repeats = 0;
  let long = 0;
  for (let half = 0; half < PARTS; half += 1) {
    const part = partOf(division, half);
    const mask = maskOf(plan.busy.division, part, day);
    holes = Math.max(holes, divisionHoles(mask, day));
    repeats = Math.max(repeats, repeatsOf(plan, part, day));
    long = Math.max(long, longDay(mask, level));
  }
  const w = weightsOf(plan.school);
  return w.S1 * holes + w.S4 * repeats + w.S5 * long;
}

/** S2, S3 of a teacher's day; nothing on a day he is away. */
function teacherCost(plan, teacher, day) {
  if (absentOn(plan, teacher, day)) return 0;
  const mask = maskOf(plan.busy.teacher, teacher, day);
  const w = weightsOf(plan.school);
  return w.S2 * teacherHoles(mask, day) + w.S3 * wishCount(plan.school.teachers[teacher], mask, day);
}

/** The EPS sessions of each division, computed once a plan. */
function epsOf(plan) {
  let eps = EPS.get(plan);
  if (!eps) {
    const lists = plan.school.divisions.map(() => []);
    plan.course.forEach((id, s) => plan.school.courses[id].discipline === "eps" && lists[plan.school.courses[id].divisions[0]].push(s));
    eps = lists.map((list) => Int16Array.from(list));
    EPS.set(plan, eps);
  }
  return eps;
}

const startOf = (plan, s) => dayOf(plan.slot[s]) * HOURS_APART + hourOf(plan.slot[s]);

/** S8: the pairs of a division's EPS sessions less than 24 h apart. */
function epsCost(plan, division) {
  const eps = epsOf(plan)[division];
  let pairs = 0;
  for (let i = 0; i < eps.length; i += 1) {
    for (let j = i + 1; j < eps.length; j += 1) if (Math.abs(startOf(plan, eps[i]) - startOf(plan, eps[j])) < HOURS_APART) pairs += 1;
  }
  return weightsOf(plan.school).S8 * pairs;
}

/** S6, S7: what a session costs on its own. */
function ownCost(plan, s) {
  const course = plan.school.courses[plan.course[s]];
  const w = weightsOf(plan.school);
  return w.S6 * lateHeavy(course, plan.slot[s]) + w.S7 * awayFromHome(course, plan.room[s]);
}

/** @param {import("./plan.js").Plan} plan */
export function softOf(plan) {
  let cost = 0;
  for (let s = 0; s < plan.course.length; s += 1) cost += ownCost(plan, s);
  for (let division = 0; division < plan.school.divisions.length; division += 1) {
    cost += epsCost(plan, division);
    for (let day = 0; day < DAYS.length; day += 1) cost += divisionCost(plan, division, day);
  }
  for (let teacher = 0; teacher < plan.school.teachers.length; teacher += 1) {
    for (let day = 0; day < DAYS.length; day += 1) cost += teacherCost(plan, teacher, day);
  }
  return cost;
}

/** One day of an area: the session's divisions, its two teachers. */
function dayArea(plan, course, day, area) {
  let cost = 0;
  for (let d = 0; d < course.divisions.length; d += 1) cost += divisionCost(plan, course.divisions[d], day);
  cost += teacherCost(plan, area.teacher0, day);
  if (area.teacher1 !== area.teacher0) cost += teacherCost(plan, area.teacher1, day);
  return cost;
}

/**
 * The part of the week's soft cost that a move of session `s` may change: its own cost, its divisions' and teachers'
 * days on the days of `area` (`day0`, `day1`, the same or not; `teacher0`, `teacher1`, likewise), its EPS pairs.
 * @param {import("./plan.js").Plan} plan
 * @param {number} s
 * @param {{ day0: number, day1: number, teacher0: number, teacher1: number }} area
 */
export function areaCost(plan, s, area) {
  const course = plan.school.courses[plan.course[s]];
  let cost = ownCost(plan, s) + dayArea(plan, course, area.day0, area);
  if (area.day1 !== area.day0) cost += dayArea(plan, course, area.day1, area);
  if (course.discipline === "eps") cost += epsCost(plan, course.divisions[0]);
  return cost;
}
