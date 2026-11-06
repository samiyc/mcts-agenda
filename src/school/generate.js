import { streamOf } from "mcts-commun/random.js";
import { LEVELS } from "../grid.js";
import { SLOTS, weeksOf } from "../time.js";
import { coursesOf } from "./courses.js";
import { needsOf, staff } from "./staff.js";

/**
 * A fictitious collège drawn from its seed (docs/modele.md § 2): its divisions, the courses and barrettes to place
 * (courses.js), its teachers and the TRS (staff.js), its rooms. The same size and seed give the same school.
 */
export const SIZES = Object.freeze({ S: 3, M: 4, L: 6 });
const LETTERS = "ABCDEFGH";
const PUPILS = { least: 24, most: 30 };
/** A specialised room is busy half of the week at most (H): its count follows the busier week's hours. */
const ROOM_SHARE = 0.5;

/** @returns {import("../types.js").Division[]} */
function drawDivisions(perLevel, rng) {
  return LEVELS.flatMap((level) => Array.from({ length: perLevel }, (_, index) => ({ level, index }))).map(
    ({ level, index }, id) => ({
      id,
      level,
      name: `${level}e ${LETTERS[index]}`,
      size: PUPILS.least + rng.int(PUPILS.most - PUPILS.least + 1),
      homeRoom: id,
    }),
  );
}

/** One ordinary room per division and one to spare; each specialised kind sized by its busier week. */
function roomsFor(divisions, courses) {
  const rooms = Array.from({ length: divisions.length + 1 }, (_, id) => ({ id, kind: "ordinary", name: `salle ${101 + id}` }));
  const kinds = [...new Set(courses.map((course) => course.kind))].filter((kind) => kind !== "ordinary");
  for (const kind of kinds) {
    const hours = [0, 1].map((week) =>
      courses
        .filter((course) => course.kind === kind && weeksOf(course.weeks).includes(week))
        .reduce((sum, course) => sum + course.length, 0),
    );
    const count = Math.max(1, Math.ceil(Math.max(...hours) / (SLOTS * ROOM_SHARE)));
    for (let n = 0; n < count; n += 1) rooms.push({ id: rooms.length, kind, name: `${kind} ${n + 1}` });
  }
  return rooms;
}

/**
 * @param {{ size?: "S" | "M" | "L", seed?: number }} [options]
 * @returns {import("../types.js").School}
 */
export function createSchool({ size = "M", seed = 1 } = {}) {
  const divisions = drawDivisions(SIZES[size], streamOf(seed, 0));
  const rngs = { services: streamOf(seed, 1), away: streamOf(seed, 2), wishes: streamOf(seed, 3) };
  const { courses: drafts, links } = coursesOf(divisions);
  const { teachers, teacherOf } = staff(needsOf(drafts), rngs);
  /** @type {import("../types.js").Course[]} */
  const courses = drafts.map(({ need, ...course }) => ({ ...course, teacher: teacherOf.get(need) }));
  return { size, seed, divisions, teachers, rooms: roomsFor(divisions, courses), courses, links };
}
