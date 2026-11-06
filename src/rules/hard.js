import { busy } from "../board.js";
import { roomsFor } from "../school/index.js";
import { DAYS, dayOf, fits, hasLunch, weeksOf } from "../time.js";
import { breakKept, dayMask, popcount } from "./day.js";

/**
 * Whether a course can start at a slot, given what is already on the board (docs/modele.md § 3.1), and if not, why:
 * the form of `holdOf` in mcts-commun's schedule. The answer is the room it would take, or a negative code read by
 * `reasonOf`. Nothing allocates: the greedy asks this hundreds of thousands of times.
 */
export const REASONS = Object.freeze(["half-day", "unavailable", "division", "teacher", "pause", "day-limit", "room"]);
const CODE = Object.freeze(Object.fromEntries(REASONS.map((reason, index) => [reason, -1 - index])));
/** The most hours of a 6e pupil's day (D6). */
export const SIXIEME_DAY = 6;

export const reasonOf = (code) => REASONS[-1 - code];

function unavailable(teacher, slot, length) {
  for (let k = 0; k < length; k += 1) if (teacher.unavailable[slot + k]) return true;
  return false;
}

/** The first of the division and the teacher that is taken at one of the course's cells, or null. */
function peopleHold(board, course, slot) {
  for (const week of weeksOf(course.weeks)) {
    for (let k = 0; k < course.length; k += 1) {
      if (busy(board.division, course.division, week, slot + k)) return CODE.division;
      if (busy(board.teacher, course.teacher, week, slot + k)) return CODE.teacher;
    }
  }
  return 0;
}

const courseBits = (course, slot) => ((1 << course.length) - 1) << (slot - DAYS[dayOf(slot)].first);

/** The division's lunch break and its day length, with the course added (D5, D6). */
function dayHold(board, course, slot) {
  const day = dayOf(slot);
  const sixieme = board.school.divisions[course.division].level === 6;
  for (const week of weeksOf(course.weeks)) {
    const mask = dayMask(board.division, course.division, week, day) | courseBits(course, slot);
    if (hasLunch(day) && !breakKept(mask)) return CODE.pause;
    if (sixieme && popcount(mask) > SIXIEME_DAY) return CODE["day-limit"];
  }
  return 0;
}

function roomFree(board, room, course, slot) {
  for (const week of weeksOf(course.weeks)) {
    for (let k = 0; k < course.length; k += 1) if (busy(board.room, room, week, slot + k)) return false;
  }
  return true;
}

/** The first room of the right kind free on every cell, the home room first; -1 if none. */
export function roomAt(board, course, slot) {
  for (const room of roomsFor(board.school, course)) if (roomFree(board, room, course, slot)) return room;
  return -1;
}

/** The room course `id` would take at `slot`, or a negative code: why it cannot start there. */
export function tryCourse(board, id, slot) {
  const course = board.school.courses[id];
  if (!fits(slot, course.length)) return CODE["half-day"];
  if (unavailable(board.school.teachers[course.teacher], slot, course.length)) return CODE.unavailable;
  const hold = peopleHold(board, course, slot) || dayHold(board, course, slot);
  if (hold) return hold;
  const room = roomAt(board, course, slot);
  return room >= 0 ? room : CODE.room;
}

