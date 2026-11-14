import { POINTS } from "./constraints-read.js";
import { COST_FUNCTIONS, deviationOf } from "./evaluate.js";

/**
 * The points of the constraints of an XHSTT instance, for the search (`state.js`): flattened, each with its
 * constraint and whether it is required, and listed under the events and the resources it depends on, so that a move
 * recomputes only the points of what it touches. A LinkEvents point whose events all lie in one unit (`layout.js`) is
 * always met, and left out.
 */

/** The events a point depends on. */
function eventsOfPoint(kind, point) {
  if (POINTS[kind] === "event") return [point];
  if (POINTS[kind] === "group") return point.events;
  return [point.first, point.second];
}

/**
 * @param {any} instance
 * @param {import("./layout.js").Layout} layout
 */
export function pointsOf(instance, layout) {
  const unitOf = new Int32Array(instance.events.list.length);
  layout.units.forEach((unit, u) => unit.events.forEach((e) => (unitOf[e] = u)));
  const flat = { constraint: [], point: [] };
  const eventPoints = instance.events.list.map(() => []);
  const resourcePoints = instance.resources.list.map(() => []);
  /** Lists the point under what it depends on, as number `p`; false for a point always met. */
  const register = (c, point, p) => {
    if (POINTS[c.kind] === "resource") return resourcePoints[point].push(p) > 0;
    const events = eventsOfPoint(c.kind, point);
    if (c.kind === "LinkEvents" && events.every((e) => unitOf[e] === unitOf[events[0]])) return false;
    for (const e of new Set(events)) eventPoints[e].push(p);
    return true;
  };
  for (const c of instance.constraints) {
    for (const point of c.points) {
      if (!register(c, point, flat.constraint.length)) continue;
      flat.constraint.push(c);
      flat.point.push(point);
    }
  }
  const required = Uint8Array.from(flat.constraint, (c) => (c.required ? 1 : 0));
  const asLists = (lists) => lists.map((l) => Int32Array.from(l));
  return { ...flat, required, eventPoints: asLists(eventPoints), resourcePoints: asLists(resourcePoints) };
}

/** The cost of point `p` in the evaluator's context `ctx`. */
export function costAt(points, ctx, p) {
  const c = points.constraint[p];
  const deviation = deviationOf(c, ctx, points.point[p]);
  return deviation > 0 ? c.weight * COST_FUNCTIONS[c.costFunction](deviation) : 0;
}
