import { kempe } from "./kempe.js";
import { moveSlot, moveTask, swapSlots } from "./moves.js";
import { idleOf, mergeSlots, splitSlot } from "./reshape.js";

/**
 * The moves the XHSTT annealing draws (`anneal.js`), each made at once and returning its change of cost, NaN when the
 * draw gives no move. `run` holds the generator, the neighbourhood (`kempe.js`) and the shares of each kind.
 */

const pick = (rng, list, count = list.length) => list[rng.int(count)];
const liveSlot = (state, rng) => pick(rng, state.live.live, state.live.count);
const domainOf = (state, s) => state.layout.units[state.layout.slots[s].unit].domainAt(state.slotDuration[s]);

function shift(state, { rng }) {
  const s = liveSlot(state, rng);
  const t = pick(rng, domainOf(state, s).domain);
  return t === state.slotTime[s] ? NaN : moveSlot(state, s, t);
}

/** Two slots that share a resource exchange their times, where both may start. */
function swap(state, { rng, near }) {
  const a = liveSlot(state, rng);
  const own = near.resourcesOf[a];
  if (own.length === 0) return NaN;
  const others = near.slotsOf[pick(rng, own)];
  const b = pick(rng, others);
  return swappable(state, a, b) ? swapSlots(state, a, b) : NaN;
}

/** Are `a` and `b` placed at two times, awake, free to move, and each allowed where the other stands? */
function swappable(state, a, b) {
  const ta = state.slotTime[a];
  const tb = state.slotTime[b];
  if (ta === tb || ta < 0 || tb < 0 || state.slotDuration[b] === 0 || state.layout.slots[b].fixed) return false;
  return domainOf(state, a).allowed[tb] === 1 && domainOf(state, b).allowed[ta] === 1;
}

function chain(state, { rng, near }) {
  const s = liveSlot(state, rng);
  return kempe(state, near, s, pick(rng, domainOf(state, s).domain));
}

function reassign(state, { rng }) {
  const task = rng.int(state.layout.tasks.length);
  const { candidates, targets } = state.layout.tasks[task];
  if (state.layout.pieces[targets[0]].duration === 0 && targets.length === 2) return NaN;
  const r = pick(rng, candidates);
  return r === state.taskResource[task] ? NaN : moveTask(state, task, r);
}

/** A piece cut in two where it stands, each part at least the unit's shortest. */
function split(state, { rng }) {
  const s = liveSlot(state, rng);
  const { lo } = state.layout.units[state.layout.slots[s].unit];
  const d = state.slotDuration[s];
  const s2 = d >= 2 * lo ? idleOf(state, s) : -1;
  return s2 < 0 ? NaN : splitSlot(state, s, s2, lo + rng.int(d - 2 * lo + 1));
}

/** The awake slot of the unit of `s` that follows it in its day (or, unplaced, any other unplaced one), or −1. */
function nextOf(state, s) {
  const unit = state.layout.units[state.layout.slots[s].unit];
  const t = state.slotTime[s];
  const end = t + state.slotDuration[s];
  const { dayOf } = state.instance.times;
  for (let i = 0; i < unit.slots.length; i += 1) {
    const x = unit.slots[i];
    if (x === s || state.slotDuration[x] === 0 || state.slotDuration[x] + state.slotDuration[s] > unit.hi) continue;
    if (t < 0 ? state.slotTime[x] < 0 : state.slotTime[x] === end && dayOf[end] === dayOf[t]) return x;
  }
  return -1;
}

function merge(state, { rng }) {
  const s = liveSlot(state, rng);
  const s2 = nextOf(state, s);
  return s2 < 0 ? NaN : mergeSlots(state, s, s2);
}

/** One move drawn and made. */
export function draw(state, run) {
  const { rng } = run;
  if (run.task > 0 && rng.next() < run.task) return reassign(state, run);
  if (state.live.count === 0) return NaN;
  const r = rng.next();
  if (r < run.reshape) return rng.next() < 0.5 ? split(state, run) : merge(state, run);
  if (r < run.reshape + run.kempe) return chain(state, run);
  return r < run.reshape + run.kempe + run.swap ? swap(state, run) : shift(state, run);
}
