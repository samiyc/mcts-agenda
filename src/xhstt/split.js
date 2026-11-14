import { COST_FUNCTIONS } from "./evaluate.js";

/**
 * How the solver first cuts the events of an XHSTT instance into pieces (docs/modele.md § 13), before it searches:
 * the durations of the pieces, longest first, chosen among the partitions of the event's duration that its required
 * SplitEvents constraints allow, at the least cost of its SplitEvents and DistributeSplitEvents constraints (a
 * required one weighing `HARD`), then with the fewest pieces. An event that no SplitEvents constraint names stays
 * whole, as does one with a preassigned time. Events that must run together (linked) are cut alike, at the least
 * cost over all of them. A piece also costs what its length must break of the required PreferTimes constraints
 * (`partCost`, from `layout.js`): an instance can forbid long pieces that way, with no SplitEvents constraint to cut
 * them (AU-SA-96), and such an event is cut too.
 */
const HARD = 1e6;
/** The partitions looked at, at most: enough for every instance of XHSTT-2014. */
const LIMIT = 20000;

const outside = (n, min, max) => Math.max(0, min - n) + Math.max(0, n - max);

/** The deviation of a SplitEvents or DistributeSplitEvents constraint for pieces of these durations. */
function deviationOf(c, parts) {
  if (c.kind === "DistributeSplitEvents") return outside(parts.filter((d) => d === c.duration).length, c.minimum, c.maximum);
  return parts.filter((d) => d < c.minDuration || d > c.maxDuration).length + outside(parts.length, c.minAmount, c.maxAmount);
}

/** The cost of one constraint for pieces of these durations, a required one weighing HARD. */
function constraintCost(c, parts) {
  const d = deviationOf(c, parts);
  if (d <= 0) return 0;
  return (c.required ? HARD : 1) * c.weight * COST_FUNCTIONS[c.costFunction](d);
}

const costOf = (constraints, parts, partCost) =>
  constraints.reduce((sum, c) => sum + constraintCost(c, parts), parts.reduce((sum, d) => sum + HARD * partCost(d), 0));

/** The split constraints of each event, a constraint named twice listed twice. */
export function splitConstraintsOf(instance) {
  const of = instance.events.list.map(() => []);
  for (const c of instance.constraints) {
    if (c.kind === "SplitEvents" || c.kind === "DistributeSplitEvents") for (const e of c.points) of[e].push(c);
  }
  return of;
}

/**
 * The bounds the required SplitEvents constraints set: piece lengths `lo` to `hi`, at most `cap` pieces; with none,
 * pieces no longer than the longest that breaks nothing (`partCost`).
 */
function boundsOf(constraints, duration, partCost) {
  let longest = duration;
  while (longest > 1 && partCost(longest) > 0) longest -= 1;
  const bounds = { lo: 1, hi: constraints.some((c) => c.kind === "SplitEvents") ? duration : longest, cap: duration };
  for (const c of constraints.filter((x) => x.kind === "SplitEvents" && x.required)) {
    bounds.lo = Math.max(bounds.lo, c.minDuration);
    bounds.hi = Math.min(bounds.hi, c.maxDuration);
    bounds.cap = Math.min(bounds.cap, c.maxAmount);
  }
  return bounds.lo > bounds.hi || bounds.cap < 1 ? { lo: 1, hi: duration, cap: duration } : bounds;
}

/** Every partition of `duration` into parts of `lo` to `hi`, longest first, at most `cap` parts, up to LIMIT. */
function partitionsOf(duration, { lo, hi, cap }) {
  const found = [];
  const parts = [];
  const walk = (left, top) => {
    if (found.length >= LIMIT) return;
    if (left === 0) found.push(parts.slice());
    if (left === 0 || parts.length >= cap) return;
    for (let d = Math.min(top, left); d >= lo; d -= 1) {
      parts.push(d);
      walk(left - d, d);
      parts.pop();
    }
  };
  walk(duration, hi);
  return found.length ? found : [[duration]];
}

/**
 * How to cut `events`, all of one duration, alike: the durations of the pieces to start from (`parts`), and the
 * bounds the search keeps to when it cuts or joins pieces (`lo`, `hi`, `cap`). A preassigned event stays whole; an
 * event that no SplitEvents constraint names starts whole, and may be cut freely.
 * @param {any} instance
 * @param {any[][]} constraintsOf the split constraints of each event (`splitConstraintsOf`)
 * @param {number[]} events
 * @param {(duration: number) => number} [partCost] what a piece of that length must break, by weight
 * @returns {{ parts: number[], lo: number, hi: number, cap: number }}
 */
export function splitOf(instance, constraintsOf, events, partCost = () => 0) {
  const { duration, time } = instance.events.list[events[0]];
  if (time >= 0) return { parts: [duration], lo: duration, hi: duration, cap: 1 };
  const constraints = events.flatMap((e) => constraintsOf[e]);
  const bounds = boundsOf(constraints, duration, partCost);
  if (!constraints.some((c) => c.kind === "SplitEvents") && partCost(duration) === 0) return { parts: [duration], ...bounds, hi: duration };
  return { parts: cheapestOf(partitionsOf(duration, bounds), (parts) => costOf(constraints, parts, partCost)), ...bounds };
}

/** The cheapest partition, then the one with the fewest pieces. */
function cheapestOf(partitions, cost) {
  let best = partitions[0];
  let bestCost = cost(best);
  for (const parts of partitions) {
    const c = cost(parts);
    if (c < bestCost || (c === bestCost && parts.length < best.length)) [best, bestCost] = [parts, c];
  }
  return best;
}
