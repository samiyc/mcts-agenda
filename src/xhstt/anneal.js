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
 */
export const XANNEAL = Object.freeze({ tries: 1e6, hot: 2, cold: 0.05, hard: 50, swap: 0.25, kempe: 0.25, reshape: 0.1, task: 0.3 });

/** The mean rise of the objective over drawn moves that keep the infeasibility, taken back; at least 1. */
function scaleOf(state, run) {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < 400; i += 1) {
    if (Number.isNaN(draw(state, run))) continue;
    if (state.dInf === 0 && state.dObj > 0) [sum, n] = [sum + state.dObj, n + 1];
    undo(state);
  }
  return n ? Math.max(1, sum / n) : 1;
}

const better = (state, best) => state.infeasibility < best.infeasibility || (state.infeasibility === best.infeasibility && state.objective < best.objective);

function snapshot(state, best) {
  best.infeasibility = state.infeasibility;
  best.objective = state.objective;
  best.plan.durations.set(state.slotDuration);
  best.plan.times.set(state.slotTime);
  best.plan.resources.set(state.taskResource);
}

/** The annealing itself, from `hot` to `cold` over `tries` moves, keeping the best plan seen in `best`. */
function walk(state, run, { best, tries, hot, cold }) {
  const cooling = Math.pow(cold / hot, 1 / tries);
  let temperature = hot;
  for (let done = 0; done < tries; done += 1, temperature *= cooling) {
    const delta = draw(state, run);
    if (Number.isNaN(delta)) continue;
    if (delta > 0 && run.rng.next() >= Math.exp(-delta / temperature)) undo(state);
    else if (better(state, best)) snapshot(state, best);
  }
}

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
  return { rng: createRng(o.seed), near: neighbourhoodOf(state), swap: o.swap, kempe: o.kempe, reshape, task };
}

/**
 * @param {import("./state.js").XState} state
 * @param {Partial<typeof XANNEAL> & { seed?: number }} [options]
 * @returns {{ state: import("./state.js").XState, plan: ReturnType<typeof planNow>, tries: number, scale: number }}
 */
export function anneal(state, options = {}) {
  const o = { ...XANNEAL, seed: 1, ...options };
  const run = runOf(state, o);
  const scale = scaleOf(state, run);
  state.hard = o.hard * scale;
  const best = { infeasibility: 0, objective: 0, plan: planNow(state) };
  snapshot(state, best);
  walk(state, run, { best, tries: o.tries, hot: o.hot * scale, cold: o.cold * scale });
  const final = createState(state.instance, state.layout, { plan: best.plan, hard: state.hard });
  return { state: final, plan: best.plan, tries: o.tries, scale };
}
