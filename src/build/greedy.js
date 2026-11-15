import { createRng } from "mcts-commun/random.js";
import { createBoard, timetableOf } from "../board.js";
import { placeLink, reasonOf, tryLink } from "../rules/hard.js";
import { linkDelta } from "../rules/soft.js";
import { SLOTS } from "../time.js";
import { placeLocked } from "./locked.js";

/**
 * The simple rules a search must beat (docs/modele.md § 5.1). They place barrettes (`School.links`), a lone course
 * being a barrette of one, all its courses at once. Neither goes back on a choice: a barrette with no option left
 * stays unplaced, with the reasons of its 40 refusals.
 * - **R0-naïf**: the barrettes in the order of the file, each at the first slot it may take.
 * - **R0**: the barrette with the fewest options first (Brélaz's saturation degree); between equals the longer, then
 *   the one with more courses, then the one of the busier teacher, then the file's order. It goes where it adds the
 *   least soft cost; between equal options, the seed draws.
 * Both put the barrettes the sandbox locks first, where they are locked (`locked.js`).
 */

/** Why a barrette could start nowhere: each reason with the slots it closed. */
function refusals(board, link) {
  /** @type {Record<string, number>} */
  const reasons = {};
  for (let slot = 0; slot < SLOTS; slot += 1) {
    const reason = reasonOf(tryLink(board, link, slot));
    reasons[reason] = (reasons[reason] ?? 0) + 1;
  }
  return reasons;
}

const left = (board, link) => ({ link, courses: board.school.links[link], reasons: refusals(board, link) });
const result = (board, unplaced) => ({ timetable: timetableOf(board), unplaced });

/** @param {import("../types.js").School} school */
export function buildNaive(school) {
  const board = createBoard(school);
  const { done, unplaced } = placeLocked(board);
  school.links.forEach((_, link) => {
    if (done.has(link)) return;
    let slot = 0;
    while (slot < SLOTS && tryLink(board, link, slot) < 0) slot += 1;
    if (slot < SLOTS) placeLink(board, link, slot);
    else unplaced.push(left(board, link));
  });
  return result(board, unplaced);
}

function optionCount(board, link) {
  let n = 0;
  for (let slot = 0; slot < SLOTS; slot += 1) if (tryLink(board, link, slot) === 0) n += 1;
  return n;
}

/** What breaks a tie between barrettes of as many options: their length, their size, their busiest teacher. */
function weightOf(school, link) {
  const ids = school.links[link];
  const load = Math.max(...ids.map((id) => school.teachers[school.courses[id].teacher].load));
  return { length: school.courses[ids[0]].length, size: ids.length, load };
}

/** Fewer options first, then the longer, then the larger, then the busier teacher, then the file's order. */
function before(a, b) {
  if (a.options !== b.options) return a.options < b.options;
  if (a.length !== b.length) return a.length > b.length;
  if (a.size !== b.size) return a.size > b.size;
  return a.load !== b.load ? a.load > b.load : a.link < b.link;
}

/** The most constrained barrette still waiting. */
function mostConstrained(board, waiting, weights) {
  let best = null;
  for (const link of waiting) {
    const candidate = { link, options: optionCount(board, link), ...weights[link] };
    if (!best || before(candidate, best)) best = candidate;
  }
  return best;
}

/** The slot adding the least cost, ties drawn by the seed; the barrette has at least one option. */
function cheapest(board, link, rng) {
  let best = null;
  let ties = 0;
  for (let slot = 0; slot < SLOTS; slot += 1) {
    if (tryLink(board, link, slot) < 0) continue;
    const delta = linkDelta(board, link, slot);
    if (!best || delta < best.delta) {
      best = { slot, delta };
      ties = 1;
    } else if (delta === best.delta) {
      ties += 1;
      if (rng.int(ties) === 0) best = { slot, delta };
    }
  }
  return best;
}

/**
 * @param {import("../types.js").School} school
 * @param {{ seed?: number }} [options]
 * @returns {{ timetable: import("../types.js").Timetable, unplaced: { link: number, courses: number[], reasons: Record<string, number>, locked?: true }[], added: number }}
 */
export function buildGreedy(school, { seed = 1 } = {}) {
  const rng = createRng(seed);
  const board = createBoard(school);
  const weights = school.links.map((_, link) => weightOf(school, link));
  const locked = placeLocked(board);
  const waiting = new Set([...school.links.keys()].filter((link) => !locked.done.has(link)));
  const { unplaced } = locked;
  let added = locked.added;
  while (waiting.size) {
    const { link, options } = mostConstrained(board, waiting, weights);
    waiting.delete(link);
    if (options === 0) {
      unplaced.push(left(board, link));
      continue;
    }
    const { slot, delta } = cheapest(board, link, rng);
    tryLink(board, link, slot);
    placeLink(board, link, slot);
    added += delta;
  }
  return { ...result(board, unplaced), added };
}
