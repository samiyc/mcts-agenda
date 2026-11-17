import { breakKept, popcount } from "../rules/day.js";
import { SIXIEME_DAY } from "../rules/division.js";
import { divisionAway } from "../rules/hard.js";
import { roomsFor } from "../school/index.js";
import { DAYS, SLOTS, dayOf, fits, hasLunch } from "../time.js";
import { absentOn, dayRoomLeft, lengthOf, mark, teacherFree } from "./plan.js";

/**
 * Where a session of the week may go (a « rattrapage » of a lost hour, or a session moved to make room for one),
 * under the hard constraints of the timetable (docs/modele.md § 3.1): its teacher there that day (not away, not
 * elsewhere: D4) and free, its teacher's day within his cap (D10), its pupils free and not kept from lessons (D11), a room of its kind free, the lunch break kept (D5), a 6e day within six
 * hours (D6), the block within a half-day (D8). Nothing allocates: a search asks this thousands of times.
 */

/** The busy slots of a part of division on a day, as bits. */
function partMask(plan, part, day) {
  const { first, count } = DAYS[day];
  let mask = 0;
  for (let i = 0; i < count; i += 1) if (plan.busy.division[part * SLOTS + first + i] > 0) mask |= 1 << i;
  return mask;
}

/** Whether the pupils of session `s` are free from `slot` and keep their lunch break and the 6e's six hours. */
function pupilsFit(plan, s, slot, length) {
  const parts = plan.parts[plan.course[s]];
  const day = dayOf(slot);
  const bits = ((1 << length) - 1) << (slot - DAYS[day].first);
  const course = plan.school.courses[plan.course[s]];
  const sixieme = plan.school.divisions[course.divisions[0]].level === 6;
  for (let p = 0; p < parts.length; p += 1) {
    const mask = partMask(plan, parts[p], day);
    if (mask & bits) return false;
    if (hasLunch(day) && !breakKept(mask | bits)) return false;
    if (sixieme && popcount(mask | bits) > SIXIEME_DAY) return false;
  }
  return true;
}

/** Whether `teacher` is at the collège that day, not elsewhere, and free from `slot`. */
export function teacherThere(plan, teacher, slot, length) {
  if (absentOn(plan, teacher, dayOf(slot))) return false;
  const away = plan.school.teachers[teacher].unavailable;
  for (let k = 0; k < length; k += 1) if (away[slot + k]) return false;
  return teacherFree(plan, teacher, slot, length) && dayRoomLeft(plan, teacher, slot, length);
}

function roomFree(plan, room, slot, length) {
  for (let k = 0; k < length; k += 1) if (plan.busy.room[room * SLOTS + slot + k] > 0) return false;
  return true;
}

/**
 * Its room in the timetable in place when free (a session put back gets its room back too), else the room it has now,
 * else the first free room of its kind; −1 if none.
 */
function roomFor(plan, s, slot, length) {
  if (roomFree(plan, plan.origin.room[s], slot, length)) return plan.origin.room[s];
  if (roomFree(plan, plan.room[s], slot, length)) return plan.room[s];
  const rooms = roomsFor(plan.school, plan.school.courses[plan.course[s]]);
  for (let r = 0; r < rooms.length; r += 1) if (roomFree(plan, rooms[r], slot, length)) return rooms[r];
  return -1;
}

/**
 * The room session `s` would take at `slot`, or −1 when it cannot go there; the board is left as it was. `fromDay`
 * is the first day the decision may touch. A locked session (the sandbox) goes nowhere.
 */
export function placeFor(plan, s, slot, fromDay) {
  const length = lengthOf(plan, s);
  if (plan.locked[s] || !fits(slot, length) || dayOf(slot) < fromDay) return -1;
  mark(plan, s, -1);
  const course = plan.school.courses[plan.course[s]];
  const ok = teacherThere(plan, plan.teacher[s], slot, length) && pupilsFit(plan, s, slot, length) && !divisionAway(plan.school, course, slot, length);
  const room = ok ? roomFor(plan, s, slot, length) : -1;
  mark(plan, s, 1);
  return room;
}
