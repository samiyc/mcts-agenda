import { POINTS } from "./constraints-read.js";
import { EVENT_DEVIATIONS, GROUP_DEVIATIONS, orderDeviation } from "./deviations-events.js";
import { RESOURCE_DEVIATIONS } from "./deviations-resources.js";

/**
 * The evaluation of an XHSTT solution, as HSEval does it: at each point of application of each constraint, a
 * deviation (`deviations-*.js`), then the cost, Weight × CostFunction(deviation); the costs of required constraints
 * add up to the infeasibility, the others to the objective. Also each cost by point and constraint, keyed as HSEval's
 * reports are (`point id|constraint id`), to compare them line by line.
 */
export const COST_FUNCTIONS = Object.freeze({
  Linear: (d) => d,
  Quadratic: (d) => d * d,
  Step: (d) => (d > 0 ? 1 : 0),
});

/** Who attends what, when; and each resource's workload. */
export function contextOf(instance, solution) {
  const T = instance.times.ids.length;
  const R = instance.resources.list.length;
  const attend = new Int32Array(R * T);
  const workload = new Float64Array(R);
  const byEvent = instance.events.list.map(() => []);
  solution.events.forEach((se, i) => {
    byEvent[se.event].push(i);
    const source = instance.events.list[se.event];
    if (se.time >= 0 && se.time + se.duration > T) throw new Error(`XHSTT : ${source.id} dépasse le dernier temps`);
    se.resources.forEach((r, k) => {
      if (r < 0) return;
      workload[r] += (se.duration * source.resources[k].workload) / source.duration;
      if (se.time >= 0) for (let d = 0; d < se.duration; d += 1) attend[r * T + se.time + d] += 1;
    });
  });
  return { instance, solution, T, attend, workload, byEvent };
}

/** The deviation of a constraint at a point, by the kind of points of the constraint. */
export function deviationOf(constraint, ctx, point) {
  switch (POINTS[constraint.kind]) {
    case "event":
      return EVENT_DEVIATIONS[constraint.kind](constraint, ctx, point);
    case "group":
      return GROUP_DEVIATIONS[constraint.kind](constraint, ctx, point);
    case "resource":
      return RESOURCE_DEVIATIONS[constraint.kind](constraint, ctx, point);
    default:
      return orderDeviation(constraint, ctx, point);
  }
}

/** The name of a point, as HSEval's reports give it. */
function nameOf(constraint, { instance }, point) {
  switch (POINTS[constraint.kind]) {
    case "event":
      return instance.events.list[point].id;
    case "group":
      return point.id;
    case "resource":
      return instance.resources.list[point].id;
    default:
      return instance.events.list[point.first].id;
  }
}

/** Adds the cost of one point to the totals and the lines. */
function add(result, constraint, id, cost) {
  if (cost === 0) return;
  const key = `${id}|${constraint.id}`;
  result.costs.set(key, (result.costs.get(key) ?? 0) + cost);
  result.byConstraint.set(constraint.id, (result.byConstraint.get(constraint.id) ?? 0) + cost);
  if (constraint.required) result.infeasibility += cost;
  else result.objective += cost;
}

/**
 * @returns {{ infeasibility: number, objective: number, costs: Map<string, number>, byConstraint: Map<string, number> }}
 */
export function evaluateSolution(instance, solution) {
  const ctx = contextOf(instance, solution);
  const result = { infeasibility: 0, objective: 0, costs: new Map(), byConstraint: new Map() };
  for (const constraint of instance.constraints) {
    const f = COST_FUNCTIONS[constraint.costFunction];
    for (const point of constraint.points) {
      const deviation = deviationOf(constraint, ctx, point);
      if (deviation > 0) add(result, constraint, nameOf(constraint, ctx, point), constraint.weight * f(deviation));
    }
  }
  return result;
}
