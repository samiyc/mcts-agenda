/**
 * The deviation of a constraint at a resource, as the XHSTT specification defines it. `ctx.attend[r * T + t]` counts
 * the solution resources assigned resource `r` whose solution event runs at time `t` (`T` times in all);
 * `ctx.workload[r]` is the workload of resource `r`, a floating-point sum.
 */

const outside = (n, min, max) => Math.max(0, min - n) + Math.max(0, n - max);
const busy = (ctx, resource, time) => ctx.attend[resource * ctx.T + time] > 0;

/** The idle times of a resource in a time group: free, with a busy time before and after it in the group. */
function idleIn(ctx, resource, times) {
  let first = -1;
  let last = -1;
  let busyCount = 0;
  times.forEach((t, i) => {
    if (!busy(ctx, resource, t)) return;
    if (first < 0) first = i;
    last = i;
    busyCount += 1;
  });
  return first < 0 ? 0 : last - first + 1 - busyCount;
}

const busyIn = (ctx, resource, times) => times.reduce((n, t) => n + (busy(ctx, resource, t) ? 1 : 0), 0);

/** An amount of workload past a limit, rounded up; the small margin absorbs the rounding of the sums. */
const roundedUp = (amount) => (amount > 1e-9 ? Math.ceil(amount - 1e-9) : 0);

export const RESOURCE_DEVIATIONS = {
  AvoidClashes(c, ctx, resource) {
    let extra = 0;
    for (let t = 0; t < ctx.T; t += 1) extra += Math.max(0, ctx.attend[resource * ctx.T + t] - 1);
    return extra;
  },
  AvoidUnavailableTimes(c, ctx, resource) {
    let n = 0;
    for (let t = 0; t < ctx.T; t += 1) if (c.unavailable[t] && busy(ctx, resource, t)) n += 1;
    return n;
  },
  LimitIdleTimes(c, ctx, resource) {
    return outside(
      c.timeGroups.reduce((sum, times) => sum + idleIn(ctx, resource, times), 0),
      c.minimum,
      c.maximum,
    );
  },
  ClusterBusyTimes(c, ctx, resource) {
    return outside(c.timeGroups.filter((times) => times.some((t) => busy(ctx, resource, t))).length, c.minimum, c.maximum);
  },
  LimitBusyTimes(c, ctx, resource) {
    return c.timeGroups.reduce((sum, times) => {
      const n = busyIn(ctx, resource, times);
      return sum + (n === 0 ? 0 : outside(n, c.minimum, c.maximum));
    }, 0);
  },
  LimitWorkload(c, ctx, resource) {
    const load = ctx.workload[resource];
    return roundedUp(c.minimum - load) + roundedUp(load - c.maximum);
  },
};
