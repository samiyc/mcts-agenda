import { createRng } from "mcts-commun/random.js";
import { draw } from "./draws.js";
import { neighbourhoodOf } from "./kempe.js";
import { undo } from "./moves.js";
import { createState, planNow } from "./state.js";

/**
 * Simulated annealing on an XHSTT state (docs/modele.md § 13), most often the simple rule's (`greedy.js`). Each step
 * draws a move (`draws.js`): a task to another candidate (`task` of the steps, when there are tasks); else a piece cut
 * or two joined (`reshape`), a Kempe chain (`kempe`), two slots that share a resource exchanging their times (`swap`),
 * or a slot to another of its times. A move that costs `d` more is kept with probability exp(−d / T), T falling
 * geometrically from `hot` to `cold` times the scale of the instance: the mean rise of the objective over drawn moves
 * that keep the infeasibility. An infeasibility point costs `hard` times that scale. The budget counts the moves
 * tried; the result is the best plan seen, infeasibility first, and a new state on it.
 *
 * A first share of the budget (`feasible`) can go to the infeasibility alone: an objective point then weighs 1/`HARD`
 * of an infeasibility point, and the temperature falls from `fhot` to `fcold` infeasibility points, whatever the
 * objective's scale; it ends early once a plan has no infeasibility left, and the annealing proper starts from the
 * best plan of that phase, with the rest of the budget.
 */
export const XANNEAL = Object.freeze({
  tries: 1e6, hot: 2, cold: 0.05, hard: 50, swap: 0.25, kempe: 0.25, reshape: 0.1, task: 0.3, feasible: 0, fhot: 2, fcold: 0.1, alike: 0, free: 0, block: 0, slide: 0,
});
/** The weight of an infeasibility point in the objective's points, in the first phase. */
const HARD = 100;

/**
 * The mean rise of the objective over drawn moves that keep the infeasibility, taken back; at least 1. When every
 * drawn move changes the infeasibility (a start far from feasible), the mean rise over all of them: falling back to 1
 * made an infeasibility point worth a few objective points, and the search traded one for the other (NL-KP-05 at
 * seed 103, docs/mesures-j7.md § 2).
 */
export function scaleOf(state, run) {
  let sum = 0;
  let n = 0;
  let any = 0;
  let m = 0;
  for (let i = 0; i < 400; i += 1) {
    if (Number.isNaN(draw(state, run))) continue;
    if (state.dObj > 0) [any, m] = [any + state.dObj, m + 1];
    if (state.dInf === 0 && state.dObj > 0) [sum, n] = [sum + state.dObj, n + 1];
    undo(state);
  }
  if (n) return Math.max(1, sum / n);
  return m ? Math.max(1, any / m) : 1;
}

const better = (state, best) => state.infeasibility < best.infeasibility || (state.infeasibility === best.infeasibility && state.objective < best.objective);

function snapshot(state, best) {
  best.infeasibility = state.infeasibility;
  best.objective = state.objective;
  best.plan.durations.set(state.slotDuration);
  best.plan.times.set(state.slotTime);
  best.plan.resources.set(state.taskResource);
}

/**
 * The annealing itself, from `hot` to `cold` over `tries` moves, keeping the best plan seen in `best`; it stops
 * early once the best has no more infeasibility than `floor`. Returns the moves tried. Every 2^20 moves it calls
 * `tick` with the moves tried since the annealing began (`from` before this walk) and its budget `of`: a long run
 * says where it is.
 */
function walk(state, run, { best, tries, hot, cold, floor, tick, from, of }) {
  const cooling = Math.pow(cold / hot, 1 / tries);
  const pace = { temperature: hot, floor };
  for (let done = 0; done < tries; done += 1, pace.temperature *= cooling) {
    if ((done & TICK_MASK) === 0) tick(from + done, of);
    if (step(state, run, best, pace)) return done + 1;
  }
  return tries;
}

/** One move of the walk at `pace.temperature`: drawn, then kept or undone; whether the best now reaches `pace.floor`. */
function step(state, run, best, pace) {
  const delta = draw(state, run);
  if (Number.isNaN(delta)) return false;
  if (delta > 0 && run.rng.next() >= Math.exp(-delta / pace.temperature)) {
    undo(state);
    return false;
  }
  if (!better(state, best)) return false;
  snapshot(state, best);
  return best.infeasibility <= pace.floor;
}

const TICK_MASK = (1 << 20) - 1;
const NOOP = () => {};

/** Can some unit be cut differently? */
const reshapes = (layout) => layout.units.some((unit) => unit.slots.length > 1);

/**
 * What the draws need (`draws.js`): the generator, the neighbourhood, and the share of each kind of move, none for a
 * kind the instance cannot have.
 * @param {import("./state.js").XState} state
 * @param {typeof XANNEAL & { seed: number }} o
 */
export function runOf(state, o) {
  const reshape = reshapes(state.layout) ? o.reshape : 0;
  const task = state.layout.tasks.length ? o.task : 0;
  return { rng: createRng(o.seed), near: neighbourhoodOf(state), swap: o.swap, kempe: o.kempe, reshape, task, alike: o.alike, free: o.free, block: o.block, slide: o.slide };
}

/**
 * @param {import("./state.js").XState} state
 * @param {Partial<typeof XANNEAL> & { seed?: number, tick?: (done: number, of: number) => void }} [options]
 * @returns {{ state: import("./state.js").XState, plan: ReturnType<typeof planNow>, tries: number, scale: number }}
 */
export function anneal(state, options = {}) {
  const o = { ...XANNEAL, seed: 1, ...options };
  const run = runOf(state, o);
  const ticks = { tick: o.tick ?? NOOP, of: o.tries };
  const scale = scaleOf(state, run);
  const best = { infeasibility: 0, objective: 0, plan: planNow(state) };
  snapshot(state, best);
  let first = Math.round(o.tries * o.feasible);
  let now = state;
  if (first > 0) {
    now.hard = HARD;
    first = walk(now, run, { best, tries: first, hot: o.fhot * HARD, cold: o.fcold * HARD, floor: 0, ...ticks, from: 0 });
    now = createState(state.instance, state.layout, { plan: best.plan });
  }
  now.hard = o.hard * scale;
  walk(now, run, { best, tries: o.tries - first, hot: o.hot * scale, cold: o.cold * scale, floor: -1, ...ticks, from: first });
  const final = createState(state.instance, state.layout, { plan: best.plan, hard: now.hard });
  return { state: final, plan: best.plan, tries: o.tries, scale };
}
