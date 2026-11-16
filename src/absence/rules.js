import { DAYS, dayOf } from "../time.js";
import { absentOn, atSchool, dayRoomLeft, lengthOf, orphan, replace, teacherFree } from "./plan.js";

/**
 * The simple rules of the replanning (docs/modele.md § 5.2), each called at every moment of the week (`run.js`):
 * - **P0, the statu quo**: nothing; every session without its teacher is an étude.
 * - **P1**: the sessions of the day without a teacher, in the order of time; each goes to a volunteer of the absent
 *   teacher's discipline, free then, who has replaced least this week; failing one, to a volunteer of the class's
 *   team (a teacher of one of its divisions); failing that, an étude. P1 touches only the day of the absence.
 *
 * Who may replace (H): a volunteer with hours left this week (`scenario.js`: 2 hours, one week in four; never more
 * than 5, Q-P15), not away that day, free at those slots and not elsewhere (D4), an EPS teacher within six hours that day (D10); the morning, only one already at the
 * collège that day (Q-P12).
 *
 * The cadrage gave P1 an exchange too, before the étude: bringing a later session of the division forward into the
 * hole. Under our score it never pays: the hour is lost all the same, the hole only moves, and a change is added.
 * Moving the lost session itself to a day its teacher is back (a « rattrapage ») does save the hour: that is the
 * search's move, beyond the day of the absence.
 */
export const MOST_REPLACEMENTS = 5;

export const p0 = () => {};

const TEAMS = new WeakMap();

/** The teachers of each division, as flags: the class's team. */
function teamsOf(school) {
  let teams = TEAMS.get(school);
  if (!teams) {
    teams = school.divisions.map(() => new Uint8Array(school.teachers.length));
    for (const course of school.courses) for (const d of course.divisions) teams[d][course.teacher] = 1;
    TEAMS.set(school, teams);
  }
  return teams;
}

/** Whether `teacher` may take session `s` now. */
export function canReplace(plan, s, teacher, ctx) {
  const slot = plan.slot[s];
  const day = dayOf(slot);
  const length = lengthOf(plan, s);
  if (absentOn(plan, teacher, day)) return false;
  if (plan.replacements[teacher] + length > Math.min(ctx.budget[teacher], MOST_REPLACEMENTS)) return false;
  if (ctx.moment === "matin" && !atSchool(plan, teacher, day)) return false;
  const away = plan.school.teachers[teacher].unavailable;
  for (let k = 0; k < length; k += 1) if (away[slot + k]) return false;
  return teacherFree(plan, teacher, slot, length) && dayRoomLeft(plan, teacher, slot, length);
}

/** The volunteer who has replaced least among those `fits` lets in, the first between equals; −1 if none. */
function leastReplaced(plan, s, ctx, fits) {
  let best = -1;
  for (let t = 0; t < plan.school.teachers.length; t += 1) {
    if (!fits(t) || !canReplace(plan, s, t, ctx)) continue;
    if (best < 0 || plan.replacements[t] < plan.replacements[best]) best = t;
  }
  return best;
}

/** Whether `teacher` teaches the absent teacher's discipline: the first who may replace. */
export function sameSubject(plan, s, teacher) {
  const { teachers, courses } = plan.school;
  return teachers[teacher].discipline === teachers[courses[plan.course[s]].teacher].discipline;
}

/** Whether `teacher` teaches one of the session's divisions: the class's team. */
export function inTeam(plan, s, teacher) {
  const teams = teamsOf(plan.school);
  return plan.school.courses[plan.course[s]].divisions.some((d) => teams[d][teacher] === 1);
}

/** P1's choice for session `s`: the discipline first, then the team; −1 for an étude. */
export function p1Choice(plan, s, ctx) {
  const first = leastReplaced(plan, s, ctx, (t) => sameSubject(plan, s, t));
  return first >= 0 ? first : leastReplaced(plan, s, ctx, (t) => inTeam(plan, s, t));
}

/** The sessions of `day` without a teacher, in the order of time. */
export function orphansOf(plan, day) {
  const { first, count } = DAYS[day];
  const found = [];
  for (let s = 0; s < plan.course.length; s += 1) if (plan.slot[s] >= first && plan.slot[s] < first + count && orphan(plan, s)) found.push(s);
  return found.sort((a, b) => plan.slot[a] - plan.slot[b] || a - b);
}

/** @param {import("./plan.js").Plan} plan */
export function p1(plan, ctx) {
  for (const s of orphansOf(plan, ctx.day)) {
    const teacher = p1Choice(plan, s, ctx);
    if (teacher >= 0) replace(plan, s, teacher, ctx.weight);
  }
}
