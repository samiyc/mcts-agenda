import { moveSlots } from "./moves.js";

/**
 * The Kempe chain of the XHSTT solver (docs/modele.md § 13): slot `s` goes from its time t1 to t2; every awake slot
 * that then shares a resource with it at t2 goes to t1, and so on, back and forth, until no move collides with a slot
 * left in place. The chain only takes slots of the same duration starting at t1 or t2, where their domains allow, and
 * at most `MAX` of them; otherwise there is no move. The resources looked at are those the pieces start with (the
 * preassigned ones): a room the search assigns can still clash, at its cost.
 */
const MAX = 48;

/** For each slot, the resources its pieces start with; for each resource, the slots that have it. */
export function neighbourhoodOf(state) {
  const { slots, pieces } = state.layout;
  const slotsOf = state.instance.resources.list.map(() => []);
  const resourcesOf = slots.map((slot, s) => {
    const own = new Set();
    for (const p of slot.fixed ? [] : slot.pieces) for (const r of pieces[p].resources) if (r >= 0) own.add(r);
    for (const r of own) slotsOf[r].push(s);
    return Int32Array.from(own);
  });
  return {
    resourcesOf, slotsOf: slotsOf.map((l) => Int32Array.from(l)),
    chain: new Int32Array(MAX), times: new Int16Array(MAX), count: 0, t1: -1, t2: -1, mark: new Int32Array(slots.length), stamp: 0,
    r: -1, d: 0,
  };
}

const overlaps = (t, d, u, e) => t < u + e && u < t + d;

/** Can slot `y` join the chain, going to `to`? */
function joins(state, y, to) {
  const slot = state.layout.slots[y];
  return !slot.fixed && state.layout.units[slot.unit].domainAt(state.slotDuration[y]).allowed[to] === 1;
}

/** Adds slot `y`, which collides with a slot of duration `d` of the chain: false if it cannot go. */
function add(state, near, y, d) {
  const ty = state.slotTime[y];
  const back = ty === near.t1 ? near.t2 : near.t1;
  if (state.slotDuration[y] !== d || (ty !== near.t1 && ty !== near.t2) || near.count >= MAX || !joins(state, y, back)) return false;
  near.mark[y] = near.stamp;
  near.chain[near.count] = y;
  near.times[near.count] = back;
  near.count += 1;
  return true;
}

/** Adds the slots that collide with the `i`-th of the chain at its new time: false if one cannot go. */
function collect(state, near, i) {
  const x = near.chain[i];
  const to = near.times[i];
  const d = state.slotDuration[x];
  const resources = near.resourcesOf[x];
  for (let r = 0; r < resources.length; r += 1) {
    const list = near.slotsOf[resources[r]];
    for (let j = 0; j < list.length; j += 1) {
      const y = list[j];
      const ty = state.slotTime[y];
      if (near.mark[y] === near.stamp || ty < 0 || !overlaps(ty, state.slotDuration[y], to, d)) continue;
      if (!add(state, near, y, d)) return false;
    }
  }
  return true;
}

/**
 * Slot `s` to `t2`, with its chain: the change of cost, or NaN when there is no such move.
 * @param {import("./state.js").XState} state
 * @param {ReturnType<typeof neighbourhoodOf>} near
 */
export function kempe(state, near, s, t2) {
  const t1 = state.slotTime[s];
  if (t1 < 0 || t2 < 0 || t1 === t2) return NaN;
  near.stamp += 1;
  near.mark[s] = near.stamp;
  near.chain[0] = s;
  near.times[0] = t2;
  near.count = 1;
  near.t1 = t1;
  near.t2 = t2;
  for (let i = 0; i < near.count; i += 1) if (!collect(state, near, i)) return NaN;
  return moveSlots(state, near.chain, near.times, near.count);
}
