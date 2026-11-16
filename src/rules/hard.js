import { busy, place, remove } from "../board.js";
import { roomsFor } from "../school/index.js";
import { DAYS, dayOf, fits, hasLunch, weeksOf } from "../time.js";
import { EPS_TEACHER_DAY, breakKept, dayCapped, dayMask, popcount } from "./day.js";
import { SIXIEME_DAY } from "./division.js";

/**
 * Whether a course can start at a slot, given what is already on the board (docs/modele.md § 3.1), and if not, why:
 * the form of `holdOf` in mcts-commun's schedule. The answer is the room it would take, or a negative code read by
 * `reasonOf`. A barrette is asked as one (`tryLink`): its courses start together or not at all (D9). Nothing
 * allocates: the greedy asks this hundreds of thousands of times.
 */
export const REASONS = Object.freeze(["half-day", "unavailable", "division", "teacher", "pause", "day-limit", "room", "teacher-day"]);
const CODE = Object.freeze(Object.fromEntries(REASONS.map((reason, index) => [reason, -1 - index])));

export const reasonOf = (code) => REASONS[-1 - code];

function unavailable(teacher, slot, length) {
  for (let k = 0; k < length; k += 1) if (teacher.unavailable[slot + k]) return true;
  return false;
}

function partsBusy(board, id, week, slot) {
  const parts = board.parts[id];
  for (let p = 0; p < parts.length; p += 1) if (busy(board.division, parts[p], week, slot)) return true;
  return false;
}

/** The first of the division and the teacher that is taken at one of the course's cells, or 0. */
function peopleHold(board, course, slot) {
  const weeks = weeksOf(course.weeks);
  for (let w = 0; w < weeks.length; w += 1) {
    const week = weeks[w];
    for (let k = 0; k < course.length; k += 1) {
      if (partsBusy(board, course.id, week, slot + k)) return CODE.division;
      if (busy(board.teacher, course.teacher, week, slot + k)) return CODE.teacher;
    }
  }
  return 0;
}

const courseBits = (course, slot) => ((1 << course.length) - 1) << (slot - DAYS[dayOf(slot)].first);

/** The lunch break and the day length of each part of division the course takes on a week, with it (D5, D6). */
function weekHold(board, course, week, slot) {
  const day = dayOf(slot);
  const bits = courseBits(course, slot);
  const sixieme = board.school.divisions[course.divisions[0]].level === 6;
  const parts = board.parts[course.id];
  for (let p = 0; p < parts.length; p += 1) {
    const mask = dayMask(board.division, parts[p], week, day) | bits;
    if (hasLunch(day) && !breakKept(mask)) return CODE.pause;
    if (sixieme && popcount(mask) > SIXIEME_DAY) return CODE["day-limit"];
  }
  return 0;
}

/** Whether an EPS teacher's day would pass six hours with the course (D10). */
function teacherDayFull(board, course, week, slot) {
  if (!dayCapped(board.school.teachers[course.teacher])) return false;
  return popcount(dayMask(board.teacher, course.teacher, week, dayOf(slot))) + course.length > EPS_TEACHER_DAY;
}

function dayHold(board, course, slot) {
  const weeks = weeksOf(course.weeks);
  for (let w = 0; w < weeks.length; w += 1) {
    const hold = weekHold(board, course, weeks[w], slot);
    if (hold) return hold;
    if (teacherDayFull(board, course, weeks[w], slot)) return CODE["teacher-day"];
  }
  return 0;
}

export function roomFree(board, room, course, slot) {
  const weeks = weeksOf(course.weeks);
  for (let w = 0; w < weeks.length; w += 1) {
    for (let k = 0; k < course.length; k += 1) if (busy(board.room, room, weeks[w], slot + k)) return false;
  }
  return true;
}

/** The first room of the right kind free on every cell, the home room first; -1 if none. */
export function roomAt(board, course, slot) {
  const rooms = roomsFor(board.school, course);
  for (let r = 0; r < rooms.length; r += 1) if (roomFree(board, rooms[r], course, slot)) return rooms[r];
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

/**
 * Whether every course of link `link` can start at `slot`: 0, their rooms written in `board.rooms` in the order of
 * the link, or the negative code of the first refusal. Each course is tried with the ones before it on the board,
 * then the board is left as it was.
 */
export function tryLink(board, link, slot) {
  const ids = board.school.links[link];
  if (ids.length === 1) {
    const room = tryCourse(board, ids[0], slot);
    board.rooms[0] = room;
    return Math.min(room, 0);
  }
  let code = 0;
  let placed = 0;
  while (placed < ids.length && code === 0) {
    const room = tryCourse(board, ids[placed], slot);
    if (room < 0) code = room;
    else {
      board.rooms[placed] = room;
      place(board, ids[placed], slot, room);
      placed += 1;
    }
  }
  for (let i = 0; i < placed; i += 1) remove(board, ids[i]);
  return code;
}

/** Puts every course of link `link` at `slot`, in the rooms `tryLink` just found. */
export function placeLink(board, link, slot) {
  const ids = board.school.links[link];
  for (let i = 0; i < ids.length; i += 1) place(board, ids[i], slot, board.rooms[i]);
}
