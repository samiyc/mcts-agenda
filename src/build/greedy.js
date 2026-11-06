import { createRng } from "mcts-commun/random.js";
import { createBoard, place, timetableOf } from "../board.js";
import { reasonOf, tryCourse } from "../rules/hard.js";
import { deltaOf } from "../rules/soft.js";
import { SLOTS } from "../time.js";

/**
 * The simple rules a search must beat (docs/modele.md § 5.1). Neither goes back on a choice: a course with no option
 * left stays unplaced, with the reasons of its 40 refusals.
 * - **R0-naïf**: the courses in the order of the file, each at the first slot it may take.
 * - **R0**: the course with the fewest options first (Brélaz's saturation degree); between equals the longer, then
 *   the one of the busier teacher, then the file's order. It goes where it adds the least soft cost; between equal
 *   options, the seed draws.
 */

/** Why a course could start nowhere: each reason with the slots it closed. */
function refusals(board, id) {
  const reasons = {};
  for (let slot = 0; slot < SLOTS; slot += 1) {
    const reason = reasonOf(tryCourse(board, id, slot));
    reasons[reason] = (reasons[reason] ?? 0) + 1;
  }
  return reasons;
}

const result = (board, unplaced) => ({ timetable: timetableOf(board), unplaced });

/** @param {import("../types.js").School} school */
export function buildNaive(school) {
  const board = createBoard(school);
  const unplaced = [];
  for (const course of school.courses) {
    let slot = 0;
    while (slot < SLOTS && tryCourse(board, course.id, slot) < 0) slot += 1;
    if (slot < SLOTS) place(board, course.id, slot, tryCourse(board, course.id, slot));
    else unplaced.push({ course: course.id, reasons: refusals(board, course.id) });
  }
  return result(board, unplaced);
}

function optionCount(board, id) {
  let n = 0;
  for (let slot = 0; slot < SLOTS; slot += 1) if (tryCourse(board, id, slot) >= 0) n += 1;
  return n;
}

/** Fewer options first, then the longer course, then the busier teacher, then the file's order. */
function before(school, a, b) {
  if (a.options !== b.options) return a.options < b.options;
  const [ca, cb] = [school.courses[a.id], school.courses[b.id]];
  if (ca.length !== cb.length) return ca.length > cb.length;
  const [la, lb] = [school.teachers[ca.teacher].load, school.teachers[cb.teacher].load];
  return la !== lb ? la > lb : a.id < b.id;
}

/** The most constrained course still waiting. */
function mostConstrained(board, waiting) {
  let best = null;
  for (const id of waiting) {
    const candidate = { id, options: optionCount(board, id) };
    if (!best || before(board.school, candidate, best)) best = candidate;
  }
  return best;
}

/** The slot and room adding the least cost, ties drawn by the seed; the course has at least one option. */
function cheapest(board, id, rng) {
  let best = null;
  let ties = 0;
  for (let slot = 0; slot < SLOTS; slot += 1) {
    const room = tryCourse(board, id, slot);
    if (room < 0) continue;
    const delta = deltaOf(board, id, slot, room);
    if (!best || delta < best.delta) {
      best = { slot, room, delta };
      ties = 1;
    } else if (delta === best.delta) {
      ties += 1;
      if (rng.int(ties) === 0) best = { slot, room, delta };
    }
  }
  return best;
}

/**
 * @param {import("../types.js").School} school
 * @param {{ seed?: number }} [options]
 * @returns {{ timetable: import("../types.js").Timetable, unplaced: { course: number, reasons: Record<string, number> }[], added: number }}
 */
export function buildGreedy(school, { seed = 1 } = {}) {
  const rng = createRng(seed);
  const board = createBoard(school);
  const waiting = new Set(school.courses.map((course) => course.id));
  const unplaced = [];
  let added = 0;
  while (waiting.size) {
    const { id, options } = mostConstrained(board, waiting);
    waiting.delete(id);
    if (options === 0) {
      unplaced.push({ course: id, reasons: refusals(board, id) });
      continue;
    }
    const { slot, room, delta } = cheapest(board, id, rng);
    place(board, id, slot, room);
    added += delta;
  }
  return { ...result(board, unplaced), added };
}
