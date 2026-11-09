/**
 * The deviation of a constraint at an event, an event group or a pair of events, as the XHSTT specification defines
 * it (http://jeffreykingston.id.au/cgi-bin/hseval.cgi?op=spec&part=constraints). `ctx` holds the instance, the
 * solution events and, for each instance event, the indexes of its solution events (`byEvent`). An event that is not
 * a point of the constraint after all (a time or a resource preassigned) gives −1.
 */

const outside = (n, min, max) => Math.max(0, min - n) + Math.max(0, n - max);

/** The solution events of instance event `event`. */
const piecesOf = (ctx, event) => ctx.byEvent[event].map((i) => ctx.solution.events[i]);

/** The event resource of `event` with `role` and no preassigned resource, or −1. */
const openRole = (ctx, event, role) => ctx.instance.events.list[event].resources.findIndex((er) => er.role === role && er.resource < 0);

const sumDurations = (pieces, keep) => pieces.reduce((sum, se) => sum + (keep(se) ? se.duration : 0), 0);

export const EVENT_DEVIATIONS = {
  AssignTime(c, ctx, event) {
    if (ctx.instance.events.list[event].time >= 0) return -1;
    return sumDurations(piecesOf(ctx, event), (se) => se.time < 0);
  },
  PreferTimes(c, ctx, event) {
    if (ctx.instance.events.list[event].time >= 0) return -1;
    return sumDurations(piecesOf(ctx, event), (se) => se.time >= 0 && !c.preferred[se.time] && (c.duration === 0 || se.duration === c.duration));
  },
  AssignResource(c, ctx, event) {
    const at = openRole(ctx, event, c.role);
    return at < 0 ? -1 : sumDurations(piecesOf(ctx, event), (se) => se.resources[at] < 0);
  },
  PreferResources(c, ctx, event) {
    const at = openRole(ctx, event, c.role);
    return at < 0 ? -1 : sumDurations(piecesOf(ctx, event), (se) => se.resources[at] >= 0 && !c.preferred[se.resources[at]]);
  },
  SplitEvents(c, ctx, event) {
    const pieces = piecesOf(ctx, event);
    const badLength = pieces.filter((se) => se.duration < c.minDuration || se.duration > c.maxDuration).length;
    return badLength + outside(pieces.length, c.minAmount, c.maxAmount);
  },
  DistributeSplitEvents(c, ctx, event) {
    return outside(piecesOf(ctx, event).filter((se) => se.duration === c.duration).length, c.minimum, c.maximum);
  },
};

/** The times a solution event runs. */
function* running(se) {
  if (se.time < 0) return;
  for (let k = 0; k < se.duration; k += 1) yield se.time + k;
}

export const GROUP_DEVIATIONS = {
  AvoidSplitAssignments(c, ctx, group) {
    const assigned = new Set();
    for (const event of group.events) {
      const at = ctx.instance.events.list[event].resources.findIndex((er) => er.role === c.role);
      if (at < 0) continue;
      for (const se of piecesOf(ctx, event)) if (se.resources[at] >= 0) assigned.add(se.resources[at]);
    }
    return Math.max(0, assigned.size - 1);
  },
  SpreadEvents(c, ctx, group) {
    const pieces = group.events.flatMap((event) => piecesOf(ctx, event)).filter((se) => se.time >= 0);
    return c.timeGroups.reduce((sum, tg) => sum + outside(pieces.filter((se) => tg.times[se.time]).length, tg.minimum, tg.maximum), 0);
  },
  LinkEvents(c, ctx, group) {
    const sets = group.events.map((event) => new Set(piecesOf(ctx, event).flatMap((se) => [...running(se)])));
    const union = new Set(sets.flatMap((set) => [...set]));
    return [...union].filter((t) => !sets.every((set) => set.has(t))).length;
  },
};

export function orderDeviation(c, ctx, pair) {
  const first = piecesOf(ctx, pair.first);
  const second = piecesOf(ctx, pair.second);
  if (!first.length || !second.length || [...first, ...second].some((se) => se.time < 0)) return 0;
  const end = Math.max(...first.map((se) => se.time + se.duration));
  const start = Math.min(...second.map((se) => se.time));
  return outside(start - end, pair.min, pair.max);
}
