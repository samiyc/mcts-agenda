import { SLOTS, WEEKS, weeksOf } from "./time.js";

/**
 * Who is where, slot by slot, on both weeks: one layer for the divisions, one for the teachers, one for the rooms.
 * A cell counts what sits there (two is a clash, D2) and keeps the course that came first. The greedy places and
 * removes without clashes; the evaluator only places, and counts the clashes.
 */
const createLayer = (resources) => ({
  count: new Uint8Array(resources * WEEKS * SLOTS),
  course: new Int16Array(resources * WEEKS * SLOTS).fill(-1),
});

export const cell = (resource, week, slot) => (resource * WEEKS + week) * SLOTS + slot;

/** @param {import("./types.js").School} school */
export function createBoard(school) {
  return {
    school,
    division: createLayer(school.divisions.length),
    teacher: createLayer(school.teachers.length),
    room: createLayer(school.rooms.length),
    slot: new Int16Array(school.courses.length).fill(-1),
    roomOf: new Int16Array(school.courses.length).fill(-1),
  };
}

function mark(layer, index, course, step) {
  layer.count[index] += step;
  if (step > 0 && layer.course[index] === -1) layer.course[index] = course;
  if (step < 0 && layer.course[index] === course) layer.course[index] = -1;
}

function apply(board, id, step) {
  const course = board.school.courses[id];
  const start = board.slot[id];
  for (const week of weeksOf(course.weeks)) {
    for (let k = 0; k < course.length; k += 1) {
      mark(board.division, cell(course.division, week, start + k), id, step);
      mark(board.teacher, cell(course.teacher, week, start + k), id, step);
      mark(board.room, cell(board.roomOf[id], week, start + k), id, step);
    }
  }
}

/** Puts course `id` at `slot` in `room`. */
export function place(board, id, slot, room) {
  board.slot[id] = slot;
  board.roomOf[id] = room;
  apply(board, id, 1);
}

/** Takes course `id` off the board. */
export function remove(board, id) {
  apply(board, id, -1);
  board.slot[id] = -1;
  board.roomOf[id] = -1;
}

export const busy = (layer, resource, week, slot) => layer.count[cell(resource, week, slot)] > 0;
export const courseAt = (layer, resource, week, slot) => layer.course[cell(resource, week, slot)];

/** The board of a timetable, every placed course on it. */
export function boardOf(school, timetable) {
  const board = createBoard(school);
  timetable.slot.forEach((slot, id) => {
    if (slot >= 0) place(board, id, slot, timetable.room[id]);
  });
  return board;
}

/** @returns {import("./types.js").Timetable} */
export const timetableOf = (board) => ({ slot: board.slot.slice(), room: board.roomOf.slice() });
