import { createRng } from "mcts-commun/random.js";
import { SLOTS } from "../time.js";
import { keepBest, resultOf, startBest } from "./best.js";
import { makeShift, makeSwap, swapDelta } from "./moves.js";
import { back, costAt, createState, insert, lift, movable, neighboursOf } from "./state.js";

/**
 * Tabu search from a timetable (docs/modele.md § 7), as Di Gaspero and Schaerf run it on course timetabling. At each
 * step, `sample` barrettes are drawn; each is tried on every other slot, and in an exchange with `swaps` of the
 * barrettes it shares a division or a teacher with (the annealing's two moves, `moves.js`). The best of these moves
 * is made, even when it costs more. A barrette may not go back to the slot it leaves for `tenure` to 2 × `tenure`
 * steps, unless that beats the best timetable met (aspiration). The budget counts the slots tried, a swap two.
 */
export const TABU = Object.freeze({ tries: 200000, sample: 20, swaps: 4, tenure: 60 });
const SHIFT = 0;
const SWAP = 1;

const allowed = (run, link, slot) => run.until[link * SLOTS + slot] <= run.step;

/** Keeps a priced move when it is the best so far, ties drawn by the seed. */
function consider(run, a, b, delta) {
  const { move } = run;
  if (move.a >= 0 && delta > move.delta) return;
  run.ties = move.a < 0 || delta < move.delta ? 1 : run.ties + 1;
  if (run.rng.int(run.ties) !== 0) return;
  move.kind = run.kind;
  move.a = a;
  move.b = b;
  move.delta = delta;
}

/** Barrette `link` on every other slot (`b` is the slot). */
function shifts(run, link, bestCost) {
  const { state } = run;
  const saved = lift(state, link);
  run.kind = SHIFT;
  for (let slot = 0; slot < SLOTS; slot += 1) {
    if (slot === state.at[link]) continue;
    run.tries += 1;
    const delta = costAt(state, link, slot) - saved;
    if (!Number.isNaN(delta) && (allowed(run, link, slot) || state.cost + delta < bestCost)) consider(run, link, slot, delta);
  }
  back(state, link);
}

/** Barrette `link` exchanged with some of its neighbours (`b` is the other barrette). */
function swaps(run, link, bestCost) {
  const { state, rng } = run;
  const partners = run.near[link];
  run.kind = SWAP;
  for (let k = 0; k < run.swaps && partners.length; k += 1) {
    const other = partners[rng.int(partners.length)];
    if (!movable(state, other) || state.at[other] === state.at[link]) continue;
    run.tries += 2;
    const delta = swapDelta(state, link, other);
    if (!Number.isNaN(delta) && (swapAllowed(run, link, other) || state.cost + delta < bestCost)) consider(run, link, other, delta);
  }
}

const swapAllowed = (run, a, b) => allowed(run, a, run.state.at[b]) && allowed(run, b, run.state.at[a]);

function makeMove(run) {
  const { state, move, rng } = run;
  const until = run.step + run.tenure + rng.int(run.tenure);
  run.until[move.a * SLOTS + state.at[move.a]] = until;
  if (move.kind === SHIFT) return makeShift(state, move.a, move.b, move.delta);
  run.until[move.b * SLOTS + state.at[move.b]] = until;
  makeSwap(state, move.a, move.b, move.delta);
}

/** A barrette R0 left, tried on every slot from one drawn, until one takes it. */
function placeOne(run) {
  const { state, rng } = run;
  const index = rng.int(state.waiting.length);
  const start = rng.int(SLOTS);
  for (let k = 0; k < SLOTS; k += 1) {
    run.tries += 1;
    if (insert(state, index, (start + k) % SLOTS)) return;
  }
}

function step(run, best) {
  const { state, rng } = run;
  if (state.waiting.length) placeOne(run);
  run.move.a = -1;
  for (let k = 0; k < run.sample; k += 1) {
    const link = rng.int(state.at.length);
    if (!movable(state, link)) continue;
    shifts(run, link, best.cost);
    swaps(run, link, best.cost);
  }
  if (run.move.a >= 0) makeMove(run);
}

/**
 * @param {import("../types.js").School} school
 * @param {import("../types.js").Timetable} timetable where to start: hard-feasible but for unplaced barrettes
 * @param {{ seed?: number, tries?: number, sample?: number, swaps?: number, tenure?: number }} [options]
 */
export function tabu(school, timetable, options = {}) {
  const { seed = 1, tries, sample, swaps: swapCount, tenure } = { ...TABU, ...options };
  const state = createState(school, timetable);
  const run = {
    state,
    rng: createRng(seed),
    near: neighboursOf(school),
    sample,
    swaps: swapCount,
    tenure,
    until: new Int32Array(school.links.length * SLOTS),
    move: { kind: SHIFT, a: -1, b: -1, delta: 0 },
    step: 0,
    tries: 0,
    ties: 0,
    kind: SHIFT,
  };
  const best = startBest(state);
  while (run.tries < tries) {
    run.step += 1;
    step(run, best);
    keepBest(best, state);
  }
  return resultOf(best, run.tries);
}
