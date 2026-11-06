import { DISCIPLINES } from "../grid.js";

/**
 * What the rules look up again and again about a school, computed once and kept beside it: the parts of divisions
 * each course takes, the EPS courses of each division, the rooms each course may take in the order to try them.
 *
 * A division has two halves, its **parts** (`partOf`): a whole-division course takes both, a half-group one. The
 * division layer of the board counts parts, so that two half-groups of one division can sit side by side.
 */
const INDEXES = new WeakMap();

export const DISCIPLINE_KEYS = Object.freeze(Object.keys(DISCIPLINES));
export const DISCIPLINE_INDEX = Object.freeze(Object.fromEntries(DISCIPLINE_KEYS.map((key, index) => [key, index])));
export const PARTS = 2;
export const partOf = (division, half) => division * PARTS + half;

/** @param {import("../types.js").Course} course */
function partsOf(course) {
  const parts = [];
  for (const division of course.divisions) {
    for (let half = 0; half < PARTS; half += 1) if (course.halves & (1 << half)) parts.push(partOf(division, half));
  }
  return Int16Array.from(parts);
}

/** @param {import("../types.js").School} school */
function build(school) {
  const eps = school.divisions.map(() => []);
  for (const course of school.courses) if (course.discipline === "eps") eps[course.divisions[0]].push(course.id);
  const roomsOfKind = new Map();
  for (const room of school.rooms) roomsOfKind.set(room.kind, [...(roomsOfKind.get(room.kind) ?? []), room.id]);
  const ordinary = roomsOfKind.get("ordinary") ?? [];
  /** A group without a home room takes the spare room first, rather than the home room of a division out at the time. */
  const spareFirst = ordinary.toReversed();
  const roomsFor = school.courses.map((course) => {
    if (course.kind !== "ordinary") return roomsOfKind.get(course.kind) ?? [];
    return course.home < 0 ? spareFirst : [course.home, ...ordinary.filter((id) => id !== course.home)];
  });
  return { parts: school.courses.map(partsOf), eps, roomsFor };
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

/** The rooms a course may take, in the order to try them: its home room first. */
export const roomsFor = (school, course) => indexOf(school).roomsFor[course.id];
