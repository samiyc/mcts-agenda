import { cut, join, MERGE, SPLIT } from "./reshape.js";
import { open, restore, setResource, setTime, settle, touchEvent, touchResource } from "./state.js";

/**
 * The moves of the XHSTT solver (docs/modele.md § 13), on a state of `state.js`: slots to other starting times (one,
 * two exchanging theirs, or a whole Kempe chain, `kempe.js`), a task to another resource; the cuts are in
 * `reshape.js`. Each returns the change of cost and leaves the move made; the caller keeps it, or takes it back with
 * `undo`. No move allocates.
 */
const TIMES = 1;
const TASK = 2;

function touchSlot(state, s) {
  const { pieces } = state.layout.slots[s];
  const events = state.ctx.solution.events;
  for (let i = 0; i < pieces.length; i += 1) {
    const se = events[pieces[i]];
    touchEvent(state, se.event);
    for (let k = 0; k < se.resources.length; k += 1) if (se.resources[k] >= 0) touchResource(state, se.resources[k]);
  }
}

function placeSlot(state, s, time) {
  const { pieces } = state.layout.slots[s];
  for (let i = 0; i < pieces.length; i += 1) setTime(state, pieces[i], time);
  state.slotTime[s] = time;
}

function fillTask(state, task, resource) {
  const { targets } = state.layout.tasks[task];
  for (let i = 0; i < targets.length; i += 2) setResource(state, targets[i], targets[i + 1], resource);
  state.taskResource[task] = resource;
}

/** Slots `slots[0..count)` start at `times[0..count)`, all in one move. */
export function moveSlots(state, slots, times, count) {
  open(state);
  const { undo: u } = state;
  u.kind = TIMES;
  u.count = count;
  for (let i = 0; i < count; i += 1) {
    touchSlot(state, slots[i]);
    u.slots[i] = slots[i];
    u.times[i] = state.slotTime[slots[i]];
  }
  for (let i = 0; i < count; i += 1) placeSlot(state, slots[i], times[i]);
  return settle(state);
}

/** Slot `s` starts at `time`. */
export function moveSlot(state, s, time) {
  open(state);
  touchSlot(state, s);
  state.undo.kind = TIMES;
  state.undo.count = 1;
  state.undo.slots[0] = s;
  state.undo.times[0] = state.slotTime[s];
  placeSlot(state, s, time);
  return settle(state);
}

/** Slots `a` and `b` exchange their starting times. */
export function swapSlots(state, a, b) {
  open(state);
  touchSlot(state, a);
  touchSlot(state, b);
  const { undo: u } = state;
  u.kind = TIMES;
  u.count = 2;
  u.slots[0] = a;
  u.slots[1] = b;
  u.times[0] = state.slotTime[a];
  u.times[1] = state.slotTime[b];
  placeSlot(state, a, u.times[1]);
  placeSlot(state, b, u.times[0]);
  return settle(state);
}

/** Task `task` is filled by `resource`. */
export function moveTask(state, task, resource) {
  open(state);
  const { targets } = state.layout.tasks[task];
  const events = state.ctx.solution.events;
  for (let i = 0; i < targets.length; i += 2) touchEvent(state, events[targets[i]].event);
  if (state.taskResource[task] >= 0) touchResource(state, state.taskResource[task]);
  if (resource >= 0) touchResource(state, resource);
  state.undo.kind = TASK;
  state.undo.a = task;
  state.undo.ta = state.taskResource[task];
  fillTask(state, task, resource);
  return settle(state);
}

/** Takes the last move back. */
export function undo(state) {
  const u = state.undo;
  if (u.kind === TASK) fillTask(state, u.a, u.ta);
  else if (u.kind === SPLIT) join(state, u.a, u.b);
  else if (u.kind === MERGE) cut(state, u.a, u.b, u.ta);
  else for (let i = u.count - 1; i >= 0; i -= 1) placeSlot(state, u.slots[i], u.times[i]);
  restore(state);
}
