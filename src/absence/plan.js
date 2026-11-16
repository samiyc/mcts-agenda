import { EPS_TEACHER_DAY, dayCapped } from "../rules/day.js";
import { PARTS, indexOf } from "../school/index.js";
import { DAYS, SLOTS, dayOf, weeksOf } from "../time.js";

/**
 * One week of the timetable in place (A or B), as the replanning sees it (docs/modele.md § 4): each course of that
 * week is a session, with its slot, its teacher and its room, which a rule may change. Beside them, who is busy when
 * (the parts of divisions, the teachers, the rooms, slot by slot), the absences known so far, and the replacement
 * hours each teacher gives. `at` names the session each part of a division has at each slot (−1: none), for the
 * soft cost (`soft.js`). `ongoing` follows an absence whose length is not known yet (J6): its first day by teacher
 * (−1: none) and the days known so far; `notices` counts the changes announced, moment after moment (`run.js`).
 *
 * The disruption is counted session by session (Müller et al.): a session that differs from the timetable in place
 * weighs the weight of the moment it last changed (half the evening before, one the morning: Q-P16), and nothing
 * once back where it was. Arrays by session, so that a search reads and writes them without allocating.
 */
export function planOf(school, timetable, week) {
  const ids = school.courses.filter((c) => timetable.slot[c.id] >= 0 && weeksOf(c.weeks).includes(week)).map((c) => c.id);
  const slot = Int16Array.from(ids, (id) => timetable.slot[id]);
  const teacher = Int16Array.from(ids, (id) => school.courses[id].teacher);
  const room = Int16Array.from(ids, (id) => timetable.room[id]);
  const plan = {
    school,
    week,
    parts: indexOf(school).parts,
    course: Int16Array.from(ids),
    slot,
    teacher,
    room,
    origin: { slot: slot.slice(), teacher: teacher.slice(), room: room.slice() },
    changed: new Float32Array(ids.length),
    busy: {
      division: new Uint8Array(school.divisions.length * PARTS * SLOTS),
      teacher: new Uint8Array(school.teachers.length * SLOTS),
      room: new Uint8Array(school.rooms.length * SLOTS),
    },
    at: new Int16Array(school.divisions.length * PARTS * SLOTS).fill(-1),
    absent: new Uint8Array(school.teachers.length * DAYS.length),
    ongoing: { from: new Int8Array(school.teachers.length).fill(-1), days: new Int8Array(school.teachers.length) },
    notices: 0,
    replacements: new Int16Array(school.teachers.length),
    /** 1 on a session the sandbox locks (`Course.fixed`): it may get a replacement, never another slot or room. */
    locked: Uint8Array.from(ids, (id) => (school.courses[id].fixed ? 1 : 0)),
  };
  for (let s = 0; s < ids.length; s += 1) mark(plan, s, 1);
  return plan;
}

/** @typedef {ReturnType<typeof planOf>} Plan */

export const lengthOf = (plan, s) => plan.school.courses[plan.course[s]].length;

/** Session `s` in (step 1) or out (step −1) of the parts' cells of `at`. */
function name(plan, cell, s, step) {
  if (step > 0) plan.at[cell] = s;
  else if (plan.at[cell] === s) plan.at[cell] = -1;
}

/** Counts session `s` in (step 1) or out (step −1) of the busy layers, where it stands. */
export function mark(plan, s, step) {
  const parts = plan.parts[plan.course[s]];
  const { division, teacher, room } = plan.busy;
  for (let k = 0; k < lengthOf(plan, s); k += 1) {
    const slot = plan.slot[s] + k;
    for (let p = 0; p < parts.length; p += 1) {
      division[parts[p] * SLOTS + slot] += step;
      name(plan, parts[p] * SLOTS + slot, s, step);
    }
    teacher[plan.teacher[s] * SLOTS + slot] += step;
    room[plan.room[s] * SLOTS + slot] += step;
  }
}

export const absentOn = (plan, teacher, day) => plan.absent[teacher * DAYS.length + day] === 1;

/** Whether session `s` has no teacher: its teacher is away on its day. */
export const orphan = (plan, s) => absentOn(plan, plan.teacher[s], dayOf(plan.slot[s]));

/** Whether `teacher` gives no session over `length` slots from `slot`. */
export function teacherFree(plan, teacher, slot, length) {
  for (let k = 0; k < length; k += 1) if (plan.busy.teacher[teacher * SLOTS + slot + k] > 0) return false;
  return true;
}

/** Whether `teacher`'s day stays within six hours with `length` more from `slot`: an EPS teacher's (D10). */
export function dayRoomLeft(plan, teacher, slot, length) {
  if (!dayCapped(plan.school.teachers[teacher])) return true;
  const { first, count } = DAYS[dayOf(slot)];
  let hours = length;
  for (let i = 0; i < count; i += 1) if (plan.busy.teacher[teacher * SLOTS + first + i] > 0) hours += 1;
  return hours <= EPS_TEACHER_DAY;
}

/** Whether `teacher` has a session on `day`: at the collège that day. */
export function atSchool(plan, teacher, day) {
  const { first, count } = DAYS[day];
  return !teacherFree(plan, teacher, first, count);
}

const differs = (plan, s) => plan.slot[s] !== plan.origin.slot[s] || plan.teacher[s] !== plan.origin.teacher[s] || plan.room[s] !== plan.origin.room[s];

/** Counts the hours of session `s` to its teacher's replacements (step 1) or back (−1), when not its own. */
function count(plan, s, step) {
  if (plan.teacher[s] !== plan.origin.teacher[s]) plan.replacements[plan.teacher[s]] += step * lengthOf(plan, s);
}

/** Session `s` now given by `teacher` at `slot` in `room`, decided at a moment of weight `weight`. */
export function setSession(plan, s, { teacher, slot, room }, weight) {
  mark(plan, s, -1);
  count(plan, s, -1);
  plan.teacher[s] = teacher;
  plan.slot[s] = slot;
  plan.room[s] = room;
  count(plan, s, 1);
  mark(plan, s, 1);
  plan.changed[s] = differs(plan, s) ? weight : 0;
}

/** Session `s` now given by `teacher`: a replacement. */
export const replace = (plan, s, teacher, weight) => setSession(plan, s, { teacher, slot: plan.slot[s], room: plan.room[s] }, weight);

/** The share of a division a session teaches: a whole division 1, a half 0.5, a group across two halves 1. */
export const shareOf = (plan, s) => plan.parts[plan.course[s]].length / PARTS;

/** The weighted disruption: the sessions that differ from the timetable in place. */
export const changesOf = (plan) => plan.changed.reduce((sum, w) => sum + w, 0);
