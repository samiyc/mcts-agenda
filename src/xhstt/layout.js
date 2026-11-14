import { splitConstraintsOf, splitOf } from "./split.js";
import { finder, leastBroken, tasksOf } from "./tasks.js";

/**
 * What the XHSTT solver moves (docs/modele.md § 13), laid out once from the instance:
 * - the **units**: the events a required LinkEvents constraint binds (same duration and preassigned time), cut alike
 *   and placed together; each with the bounds of its cuts (`split.js`) and a pool of **slots**, one per piece it can
 *   have at most;
 * - the **pieces**, the solution events: one per event of the unit and slot, with a duration (0 while its slot is
 *   idle), a time (−1 until placed, or the preassigned one) and a resource for each of its event resources (−1 for an
 *   open one). The search cuts a piece in two or joins two (`reshape.js`), which wakes or idles a slot;
 * - the **domains**: where a piece of a unit and a duration may start: in one day, at the times that break the fewest
 *   required PreferTimes constraints of its events (none, most often), or nowhere (−1);
 * - the **tasks** (`tasks.js`): an open event resource to fill.
 *
 * `initial` gives each slot's duration to start from, `byEvent` the pieces each event starts with.
 */

/** The events of each unit: linked by a required LinkEvents constraint, of one duration and preassigned time. */
function unitsOf(instance) {
  const events = instance.events.list;
  const sets = finder(events.length);
  const alike = (group) => group.every((e) => events[e].duration === events[group[0]].duration && events[e].time === events[group[0]].time);
  const groups = instance.constraints.filter((c) => c.kind === "LinkEvents" && c.required).flatMap((c) => c.points.map((p) => p.events));
  for (const group of groups.filter(alike)) for (const e of group) sets.union(e, group[0]);
  const byRoot = new Map();
  events.forEach((_, e) => {
    const root = sets.find(e);
    byRoot.set(root, [...(byRoot.get(root) ?? []), e]);
  });
  return [...byRoot.values()];
}

/** Can a piece of `duration` start at `start`: inside the times, and inside one day when the times have days. */
function fits(dayOf, start, duration) {
  if (start + duration > dayOf.length) return false;
  for (let k = 1; k < duration; k += 1) if (dayOf[start + k] !== dayOf[start]) return false;
  return true;
}

/** The required PreferTimes constraints of each event. */
function preferTimesOf(instance) {
  const of = instance.events.list.map(() => []);
  for (const c of instance.constraints) if (c.kind === "PreferTimes" && c.required) for (const e of c.points) of[e].push(c);
  return of;
}

/**
 * Where a piece of `duration` of `events` may start: in one day if it can, then the times that break the least weight
 * of their required PreferTimes constraints (`least`, 0 most often); and −1, unplaced, which can be cheaper. Also the
 * same as flags over the times (`allowed`).
 */
function domainOf(instance, preferred, events, duration) {
  const { dayOf } = instance.times;
  const all = Array.from({ length: Math.max(0, dayOf.length - duration + 1) }, (_, t) => t);
  const inDay = all.filter((t) => fits(dayOf, t, duration));
  const rules = events.flatMap((e) => preferred[e]).filter((c) => c.duration === 0 || c.duration === duration);
  const { kept, least } = leastBroken(inDay.length ? inDay : all, rules, (c, t) => c.preferred[t] === 1);
  const allowed = new Uint8Array(dayOf.length);
  for (const t of kept) allowed[t] = 1;
  return { domain: Int16Array.from([...kept, -1]), allowed, least };
}

/** A unit: its events, duration, preassigned time, cut bounds, and its domains by duration, worked out when asked. */
function unitOf(instance, { splits, preferred }, events) {
  const { duration, time } = instance.events.list[events[0]];
  const domains = new Array(duration + 1);
  const domainAt = (d) => (domains[d] ??= domainOf(instance, preferred, events, d));
  const { parts, lo, hi, cap } = splitOf(instance, splits, events, (d) => domainAt(d).least * d);
  return { events: Int32Array.from(events), duration, time, lo, hi, cap, parts, domains, domainAt, slots: new Int32Array(0) };
}

/** The pool of a unit: as many slots as it can have pieces, the first ones awake with the starting cut. */
function pool(unit, u, layout) {
  const size = Math.max(unit.parts.length, Math.min(unit.duration, unit.cap, Math.floor(unit.duration / unit.lo)));
  const ids = [];
  for (let j = 0; j < size; j += 1) {
    const duration = unit.parts[j] ?? 0;
    const pieces = Array.from(unit.events, (event) => {
      if (duration) layout.byEvent[event].push(layout.pieces.length);
      const resources = Int32Array.from(layout.instance.events.list[event].resources, (er) => er.resource);
      const tasks = new Int32Array(resources.length).fill(-1);
      return layout.pieces.push({ event, duration, time: duration ? unit.time : -1, resources, tasks }) - 1;
    });
    ids.push(layout.slots.length);
    layout.slots.push({ unit: u, pieces: Int32Array.from(pieces), fixed: unit.time >= 0 });
    layout.initial.push(duration);
  }
  unit.slots = Int32Array.from(ids);
}

/**
 * @param {any} instance an XHSTT instance (`instance.js`)
 */
export function layoutOf(instance) {
  const context = { splits: splitConstraintsOf(instance), preferred: preferTimesOf(instance) };
  const units = unitsOf(instance).map((events) => unitOf(instance, context, events));
  const layout = { instance, units, slots: [], pieces: [], initial: [], byEvent: instance.events.list.map(() => []), tasks: [] };
  units.forEach((unit, u) => pool(unit, u, layout));
  const poolOf = instance.events.list.map(() => []);
  layout.pieces.forEach((piece, i) => poolOf[piece.event].push(i));
  layout.tasks = tasksOf(instance, layout.pieces, poolOf);
  return { ...layout, initial: Int16Array.from(layout.initial) };
}

/** @typedef {ReturnType<typeof layoutOf>} Layout */
