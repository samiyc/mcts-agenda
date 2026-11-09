import { createRng } from "mcts-commun/random.js";
import { SLOTS } from "../time.js";
import { keepBest, resultOf, startBest } from "./best.js";
import { makeShift, makeSwap, shiftDelta, swapDelta } from "./moves.js";
import { createState, insert, neighboursOf } from "./state.js";

/**
 * Simulated annealing from a timetable (docs/modele.md § 7), most often R0's. Each step draws a move: a barrette to
 * another slot, or two barrettes that share a division or a teacher exchanging their slots (`moves.js`). A move that
 * costs less is kept; one that costs `d` more is kept with probability exp(−d / T), the temperature T falling
 * geometrically from `hot` to `cold` over the budget. Now and then a barrette R0 left tries a slot. The budget counts
 * the slots tried, a swap two.
 */
export const ANNEAL = Object.freeze({ tries: 200000, hot: 8, cold: 0.3, swap: 0.5 });
/** One step in this many tries a barrette left unplaced, when there is one. */
const INSERT_EVERY = 16;

const keep = (delta, temperature, rng) => delta <= 0 || rng.next() < Math.exp(-delta / temperature);

/** A barrette to another slot: the tries it took. */
function shift(run, link) {
  const { state, rng } = run;
  const slot = (state.at[link] + 1 + rng.int(SLOTS - 1)) % SLOTS;
  const delta = shiftDelta(state, link, slot);
  if (!Number.isNaN(delta) && keep(delta, run.temperature, rng)) makeShift(state, link, slot, delta);
  return 1;
}

/** Barrettes `a` and `b` exchange their slots: the tries it took. */
function swap(run, a, b) {
  const { state, rng } = run;
  const delta = swapDelta(state, a, b);
  if (!Number.isNaN(delta) && keep(delta, run.temperature, rng)) makeSwap(state, a, b, delta);
  return 2;
}

function step(run) {
  const { state, rng, near } = run;
  if (state.waiting.length && rng.int(INSERT_EVERY) === 0) {
    insert(state, rng.int(state.waiting.length), rng.int(SLOTS));
    return 1;
  }
  const link = rng.int(state.at.length);
  if (state.at[link] < 0) return 0;
  const partners = near[link];
  if (rng.next() >= run.swapShare || partners.length === 0) return shift(run, link);
  const other = partners[rng.int(partners.length)];
  return state.at[other] < 0 || state.at[other] === state.at[link] ? 0 : swap(run, link, other);
}

/**
 * @param {import("../types.js").School} school
 * @param {import("../types.js").Timetable} timetable where to start: hard-feasible but for unplaced barrettes
 * @param {{ seed?: number, tries?: number, hot?: number, cold?: number, swap?: number }} [options]
 */
export function anneal(school, timetable, options = {}) {
  const { seed = 1, tries, hot, cold, swap: swapShare } = { ...ANNEAL, ...options };
  const state = createState(school, timetable);
  const run = { state, rng: createRng(seed), near: neighboursOf(school), temperature: hot, swapShare };
  const best = startBest(state);
  const cooling = Math.pow(cold / hot, 1 / tries);
  let done = 0;
  while (done < tries) {
    const spent = step(run);
    done += spent;
    run.temperature *= Math.pow(cooling, spent);
    keepBest(best, state);
  }
  return resultOf(best, done);
}
