import { DISCIPLINES } from "../grid.js";

/**
 * What the rules look up again and again about a school, computed once and kept beside it: the courses of each
 * division, its EPS courses, the rooms of each kind (the home room first for a division's ordinary courses).
 */
const INDEXES = new WeakMap();

export const DISCIPLINE_KEYS = Object.freeze(Object.keys(DISCIPLINES));
export const DISCIPLINE_INDEX = Object.freeze(Object.fromEntries(DISCIPLINE_KEYS.map((key, index) => [key, index])));

/** @param {import("../types.js").School} school */
function build(school) {
  const byDivision = school.divisions.map(() => []);
  const eps = school.divisions.map(() => []);
  for (const course of school.courses) {
    byDivision[course.division].push(course.id);
    if (course.discipline === "eps") eps[course.division].push(course.id);
  }
  const roomsOfKind = new Map();
  for (const room of school.rooms) roomsOfKind.set(room.kind, [...(roomsOfKind.get(room.kind) ?? []), room.id]);
  const ordinary = roomsOfKind.get("ordinary") ?? [];
  const homeFirst = school.divisions.map((division) => [division.homeRoom, ...ordinary.filter((id) => id !== division.homeRoom)]);
  return { byDivision, eps, roomsOfKind, homeFirst };
}

/** @param {import("../types.js").School} school */
export function indexOf(school) {
  let index = INDEXES.get(school);
  if (!index) {
    index = build(school);
    INDEXES.set(school, index);
  }
  return index;
}

/** The rooms a course may take, in the order to try them. */
export function roomsFor(school, course) {
  const index = indexOf(school);
  return course.kind === "ordinary" ? index.homeFirst[course.division] : (index.roomsOfKind.get(course.kind) ?? []);
}
