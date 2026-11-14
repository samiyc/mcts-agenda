import { contextOf } from "./evaluate.js";
import { costAt, pointsOf } from "./points.js";

/**
 * An XHSTT solution under search (docs/modele.md § 13): the pieces of `layout.js` with their durations, times and
 * resources, who attends what and each resource's workload (the evaluator's context), and the cost of every point of
 * every constraint (`points.js`), kept up to date move by move.
 *
 * A move opens (`open`), names what it touches (`touchEvent`, `touchResource`: the points of those events and
 * resources), changes the pieces (`setTime`, `setShape`, `setResource`), then `settle` recomputes the touched points
 * with the evaluator's own deviations (`evaluate.js`, checked against HSEval at J4) and returns the change of cost, the
 * infeasibility counting `hard` times. To take a move back, the caller sets the pieces back, then calls `restore`.
 * The tests check the running totals against `evaluateSolution`.
 *
 * A state starts from a **plan**: each slot's duration (0: idle) and time, each task's resource. The search keeps its
 * best plan, and a new state on it gives the solution.
 */

/** The plan of a fresh layout: its starting cut, the preassigned times, no resource yet. */
export function planOf(layout) {
  return {
    durations: layout.initial.slice(),
    times: Int16Array.from(layout.slots, (slot) => (slot.fixed ? layout.units[slot.unit].time : -1)),
    resources: new Int32Array(layout.tasks.length).fill(-1),
  };
}

/** Sets the pieces of the layout as the plan says, and which pieces each event has. */
function lay(layout, plan) {
  for (const list of layout.byEvent) list.length = 0;
  layout.slots.forEach((slot, s) => {
    const d = plan.durations[s];
    for (const p of slot.pieces) {
      Object.assign(layout.pieces[p], { duration: d, time: d ? plan.times[s] : -1 });
      if (d) layout.byEvent[layout.pieces[p].event].push(p);
    }
  });
  layout.tasks.forEach((task, k) => {
    for (let i = 0; i < task.targets.length; i += 2) layout.pieces[task.targets[i]].resources[task.targets[i + 1]] = plan.resources[k];
  });
}

/** The awake slots that may move, as a list with each slot's place in it (−1: not there). */
function liveOf(layout, plan) {
  const live = new Int32Array(layout.slots.length);
  const at = new Int32Array(layout.slots.length).fill(-1);
  let count = 0;
  layout.slots.forEach((slot, s) => {
    if (slot.fixed || !plan.durations[s]) return;
    at[s] = count;
    live[count++] = s;
  });
  return { live, at, count };
}

/**
 * @param {any} instance an XHSTT instance
 * @param {import("./layout.js").Layout} layout its pieces become this state's
 * @param {{ hard?: number, plan?: ReturnType<typeof planOf> }} [options]
 */
export function createState(instance, layout, { hard = 1e6, plan = planOf(layout) } = {}) {
  lay(layout, plan);
  const ctx = contextOf(instance, { events: layout.pieces });
  ctx.byEvent = layout.byEvent;
  const points = pointsOf(instance, layout);
  const P = points.constraint.length;
  const state = {
    instance, layout, ctx, points, hard, live: liveOf(layout, plan),
    slotDuration: plan.durations.slice(), slotTime: plan.times.slice(), taskResource: plan.resources.slice(),
    cost: new Float64Array(P), infeasibility: 0, objective: 0,
    mark: new Int32Array(P), stamp: 0, touched: new Int32Array(P), old: new Float64Array(P), n: 0, dInf: 0, dObj: 0,
    undo: { kind: 0, a: -1, b: -1, ta: 0, tb: 0, count: 0, slots: new Int32Array(layout.slots.length), times: new Int16Array(layout.slots.length) },
  };
  for (let p = 0; p < P; p += 1) {
    state.cost[p] = costAt(points, ctx, p);
    if (points.required[p]) state.infeasibility += state.cost[p];
    else state.objective += state.cost[p];
  }
  return state;
}

/** @typedef {ReturnType<typeof createState>} XState */

/** The plan the state stands on. */
export const planNow = (state) => ({ durations: state.slotDuration.slice(), times: state.slotTime.slice(), resources: state.taskResource.slice() });

export function open(state) {
  state.stamp += 1;
  state.n = 0;
}

function touchPoints(state, list) {
  for (let i = 0; i < list.length; i += 1) {
    const p = list[i];
    if (state.mark[p] === state.stamp) continue;
    state.mark[p] = state.stamp;
    state.touched[state.n] = p;
    state.old[state.n] = state.cost[p];
    state.n += 1;
  }
}

export const touchEvent = (state, event) => touchPoints(state, state.points.eventPoints[event]);
export const touchResource = (state, resource) => touchPoints(state, state.points.resourcePoints[resource]);

/** Recomputes the touched points: the change of cost, the infeasibility counting `hard` times. */
export function settle(state) {
  let dInf = 0;
  let dObj = 0;
  for (let i = 0; i < state.n; i += 1) {
    const p = state.touched[i];
    const now = costAt(state.points, state.ctx, p);
    state.cost[p] = now;
    if (state.points.required[p]) dInf += now - state.old[i];
    else dObj += now - state.old[i];
  }
  state.infeasibility += dInf;
  state.objective += dObj;
  state.dInf = dInf;
  state.dObj = dObj;
  return dInf * state.hard + dObj;
}

/** Puts the touched points back, once the pieces are back. */
export function restore(state) {
  for (let i = 0; i < state.n; i += 1) state.cost[state.touched[i]] = state.old[i];
  state.infeasibility -= state.dInf;
  state.objective -= state.dObj;
}

function attend(ctx, resource, se, sign) {
  if (se.time < 0) return;
  const base = resource * ctx.T + se.time;
  for (let k = 0; k < se.duration; k += 1) ctx.attend[base + k] += sign;
}

/** The workload piece `se` brings to its event resource `k`. */
const loadOf = (state, se, k) => {
  const source = state.instance.events.list[se.event];
  return (se.duration * source.resources[k].workload) / source.duration;
};

/** Piece `piece` lasts `duration` (0: idle) and starts at `time` (−1: unplaced). */
export function setShape(state, piece, duration, time) {
  const { ctx } = state;
  const se = ctx.solution.events[piece];
  const { resources } = se;
  for (let k = 0; k < resources.length; k += 1) {
    if (resources[k] < 0) continue;
    attend(ctx, resources[k], se, -1);
    ctx.workload[resources[k]] -= loadOf(state, se, k);
  }
  se.duration = duration;
  se.time = time;
  for (let k = 0; k < resources.length; k += 1) {
    if (resources[k] < 0) continue;
    attend(ctx, resources[k], se, 1);
    ctx.workload[resources[k]] += loadOf(state, se, k);
  }
}

/** Piece `piece` starts at `time` (−1: unplaced). */
export function setTime(state, piece, time) {
  const se = state.ctx.solution.events[piece];
  const { resources } = se;
  for (let k = 0; k < resources.length; k += 1) if (resources[k] >= 0) attend(state.ctx, resources[k], se, -1);
  se.time = time;
  for (let k = 0; k < resources.length; k += 1) if (resources[k] >= 0) attend(state.ctx, resources[k], se, 1);
}

/** Event resource `k` of piece `piece` is `resource` (−1: none). */
export function setResource(state, piece, k, resource) {
  const { ctx } = state;
  const se = ctx.solution.events[piece];
  const load = loadOf(state, se, k);
  const old = se.resources[k];
  if (old >= 0) {
    ctx.workload[old] -= load;
    attend(ctx, old, se, -1);
  }
  se.resources[k] = resource;
  if (resource >= 0) {
    ctx.workload[resource] += load;
    attend(ctx, resource, se, 1);
  }
}
