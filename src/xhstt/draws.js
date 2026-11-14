import { block, slide } from "./block.js";
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

/**
 * Two slots that share a resource exchange their times, where both may start. With probability `alike`, the second is
 * the first one of the same duration met from a random place in the resource's list.
 */
function swap(state, { rng, near, alike }) {
  const a = liveSlot(state, rng);
  const own = near.resourcesOf[a];
  if (own.length === 0) return NaN;
  const others = near.slotsOf[pick(rng, own)];
  const b = alike > 0 && rng.next() < alike ? sameOf(state, others, a, rng.int(others.length)) : pick(rng, others);
  return b >= 0 && swappable(state, a, b) ? swapSlots(state, a, b) : NaN;
}

/** The first slot of `list` from `from` on (round), other than `a`, placed and as long as it; or −1. */
function sameOf(state, list, a, from) {
  const d = state.slotDuration[a];
  for (let i = 0; i < list.length; i += 1) {
    const b = list[(from + i) % list.length];
    if (b !== a && state.slotDuration[b] === d && state.slotTime[b] >= 0 && state.slotTime[b] !== state.slotTime[a]) return b;
  }
  return -1;
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

/**
 * A task to another candidate: with probability `free`, the first met from a random place in its list that is busy
 * nowhere during the task's placed pieces; else any.
 */
/** A slot to another of its times, exchanging its span with what one of its resources does there (`block.js`). */
function exchange(state, run) {
  const s = liveSlot(state, run.rng);
  return block(state, run, s, pick(run.rng, domainOf(state, s).domain));
}

/** All the slots of a resource of a slot, one time earlier or later (`block.js`). */
function slideOf(state, { rng, near }) {
  const own = near.resourcesOf[liveSlot(state, rng)];
  if (own.length === 0) return NaN;
  const delta = rng.next() < 0.5 ? -1 : 1;
  return slide(state, near, pick(rng, own), delta);
}

function reassign(state, { rng, free }) {
  const task = rng.int(state.layout.tasks.length);
  const { candidates, targets } = state.layout.tasks[task];
  if (state.layout.pieces[targets[0]].duration === 0 && targets.length === 2) return NaN;
  const r = free > 0 && rng.next() < free ? freeOf(state, task, rng.int(candidates.length)) : pick(rng, candidates);
  return r === state.taskResource[task] ? NaN : moveTask(state, task, r);
}

/** Is resource `r` busy at some time of a placed piece of `targets`? */
function busy(state, r, targets) {
  const T = state.instance.times.ids.length;
  const { attend } = state.ctx;
  for (let i = 0; i < targets.length; i += 2) {
    const piece = state.layout.pieces[targets[i]];
    for (let t = piece.time; t >= 0 && t < piece.time + piece.duration; t += 1) if (attend[r * T + t] > 0) return true;
  }
  return false;
}

/** The first candidate of `task` from `from` on (round), a resource free at its times; or its current one. */
function freeOf(state, task, from) {
  const { candidates, targets } = state.layout.tasks[task];
  for (let i = 0; i < candidates.length; i += 1) {
    const r = candidates[(from + i) % candidates.length];
    if (r >= 0 && r !== state.taskResource[task] && !busy(state, r, targets)) return r;
  }
  return state.taskResource[task];
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

/** A move of times other than a chain, `r` drawn below the shares left. */
function moveTimes(state, run, r) {
  if (r < run.swap) return swap(state, run);
  if (r < run.swap + run.block) return exchange(state, run);
  return r < run.swap + run.block + run.slide ? slideOf(state, run) : shift(state, run);
}

/** One move drawn and made. */
export function draw(state, run) {
  const { rng } = run;
  if (run.task > 0 && rng.next() < run.task) return reassign(state, run);
  if (state.live.count === 0) return NaN;
  const r = rng.next();
  if (r < run.reshape) return rng.next() < 0.5 ? split(state, run) : merge(state, run);
  return r < run.reshape + run.kempe ? chain(state, run) : moveTimes(state, run, r - run.reshape - run.kempe);
}
