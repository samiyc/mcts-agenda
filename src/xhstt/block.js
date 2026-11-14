import { moveSlots } from "./moves.js";

/**
 * The block exchange of the XHSTT solver (docs/modele.md § 13): slot `s`, of duration d, goes from t1 to t2, and the
 * slots of one of its resources `r` that lie within [t2, t2 + d) go to [t1, t1 + d), each keeping its offset. A double
 * thus changes places with two singles of the same class, and a full class stays full. No slot of `r` may straddle
 * either edge, the two spans may not overlap, and each slot must be allowed where it goes; otherwise there is no move.
 * It uses the arrays of the Kempe chain's neighbourhood (`kempe.js`), and its `r` and `d` for the move at hand.
 *
 * The slide: every placed slot of a resource one time earlier or later, each in its day. A class that starts each
 * day at its second time can thus start at its first on all days at once, where a LimitBusyTimes over the first times
 * (KS-PR-11: busy at least five of them, if at any) makes one first time alone cost more than it saves.
 */

/** May slot `y` start at `t`? */
export function allowedAt(state, y, t) {
  const slot = state.layout.slots[y];
  return !slot.fixed && state.layout.units[slot.unit].domainAt(state.slotDuration[y]).allowed[t] === 1;
}

/** Is slot `y` placed, awake, not yet taken, and running at some time of [from, from + near.d)? */
function meets(state, near, y, from) {
  const ty = state.slotTime[y];
  const dy = state.slotDuration[y];
  return ty >= 0 && dy > 0 && near.mark[y] !== near.stamp && ty + dy > from && ty < from + near.d;
}

/** Adds the slots of `near.r` within [from, from + near.d), each to the same place from `to`: false if one cannot go. */
function gather(state, near, from, to) {
  const list = near.slotsOf[near.r];
  for (let j = 0; j < list.length; j += 1) {
    const y = list[j];
    if (!meets(state, near, y, from)) continue;
    const ty = state.slotTime[y];
    if (ty < from || ty + state.slotDuration[y] > from + near.d || near.count >= near.chain.length || !allowedAt(state, y, to + ty - from)) return false;
    near.mark[y] = near.stamp;
    near.chain[near.count] = y;
    near.times[near.count] = to + ty - from;
    near.count += 1;
  }
  return true;
}

/**
 * Slot `s` to `t2`, exchanging its span with what one of its resources, drawn, does there: the change of cost, or NaN.
 * @param {import("./state.js").XState} state
 * @param {{ rng: { int: (n: number) => number }, near: ReturnType<typeof import("./kempe.js").neighbourhoodOf> }} run
 */
export function block(state, run, s, t2) {
  const { near } = run;
  const own = near.resourcesOf[s];
  const t1 = state.slotTime[s];
  const d = state.slotDuration[s];
  if (own.length === 0 || t1 < 0 || Math.abs(t2 - t1) < d || !allowedAt(state, s, t2)) return NaN;
  near.r = own[run.rng.int(own.length)];
  near.d = d;
  near.stamp += 1;
  near.count = 0;
  if (!gather(state, near, t1, t2) || !gather(state, near, t2, t1)) return NaN;
  return near.count < 2 ? NaN : moveSlots(state, near.chain, near.times, near.count);
}

/**
 * Every placed slot of resource `r` moved by `delta`: the change of cost, or NaN if one cannot go.
 * @param {import("./state.js").XState} state
 * @param {ReturnType<typeof import("./kempe.js").neighbourhoodOf>} near
 */
export function slide(state, near, r, delta) {
  const list = near.slotsOf[r];
  near.count = 0;
  for (let j = 0; j < list.length; j += 1) {
    const y = list[j];
    const ty = state.slotTime[y];
    if (ty < 0 || state.slotDuration[y] === 0) continue;
    if (near.count >= near.chain.length || !allowedAt(state, y, ty + delta)) return NaN;
    near.chain[near.count] = y;
    near.times[near.count] = ty + delta;
    near.count += 1;
  }
  return near.count === 0 ? NaN : moveSlots(state, near.chain, near.times, near.count);
}
