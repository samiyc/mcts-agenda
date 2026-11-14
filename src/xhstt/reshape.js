import { open, setResource, setShape, settle, touchEvent, touchResource } from "./state.js";

/**
 * The moves that change how a unit is cut (docs/modele.md § 13): a piece cut in two where it stands, which wakes an
 * idle slot of its unit for the second part; two pieces that follow each other in a day joined into one, which idles
 * the second slot. The second part of a cut takes the resources of the first, so the times each resource attends do
 * not change. `cut` and `join` are the bare changes, which `moves.js` also uses to take a move back.
 */
export const SPLIT = 3;
export const MERGE = 4;

/** An idle slot of the unit of slot `s`, or −1. */
export function idleOf(state, s) {
  const { slots } = state.layout.units[state.layout.slots[s].unit];
  for (let i = 0; i < slots.length; i += 1) if (state.slotDuration[slots[i]] === 0) return slots[i];
  return -1;
}

function wake(state, s) {
  const { live } = state;
  live.at[s] = live.count;
  live.live[live.count] = s;
  live.count += 1;
}

function sleep(state, s) {
  const { live } = state;
  const last = live.live[live.count - 1];
  live.live[live.at[s]] = last;
  live.at[last] = live.at[s];
  live.at[s] = -1;
  live.count -= 1;
}

/** The pieces of idle slot `s2` take the resources of those of slot `s`, in the tasks they do not share. */
function copyResources(state, s, s2) {
  const pieces = state.layout.pieces;
  const a = state.layout.slots[s].pieces;
  const b = state.layout.slots[s2].pieces;
  for (let i = 0; i < a.length; i += 1) {
    const { tasks } = pieces[b[i]];
    for (let k = 0; k < tasks.length; k += 1) {
      if (tasks[k] < 0 || tasks[k] === pieces[a[i]].tasks[k]) continue;
      setResource(state, b[i], k, pieces[a[i]].resources[k]);
      state.taskResource[tasks[k]] = pieces[a[i]].resources[k];
    }
  }
}

/** Slot `s` keeps its first `first` times; idle slot `s2` takes the rest. */
export function cut(state, s, s2, first) {
  const d = state.slotDuration[s];
  const t = state.slotTime[s];
  const t2 = t < 0 ? -1 : t + first;
  const a = state.layout.slots[s].pieces;
  const b = state.layout.slots[s2].pieces;
  for (let i = 0; i < a.length; i += 1) {
    setShape(state, a[i], first, t);
    setShape(state, b[i], d - first, t2);
    state.ctx.byEvent[state.layout.pieces[b[i]].event].push(b[i]);
  }
  state.slotDuration[s] = first;
  state.slotDuration[s2] = d - first;
  state.slotTime[s2] = t2;
  wake(state, s2);
}

/** Slot `s` takes the times of slot `s2`, which follows it; `s2` goes idle. */
export function join(state, s, s2) {
  const d = state.slotDuration[s] + state.slotDuration[s2];
  const a = state.layout.slots[s].pieces;
  const b = state.layout.slots[s2].pieces;
  for (let i = 0; i < a.length; i += 1) {
    setShape(state, b[i], 0, -1);
    setShape(state, a[i], d, state.slotTime[s]);
    const list = state.ctx.byEvent[state.layout.pieces[b[i]].event];
    list.splice(list.indexOf(b[i]), 1);
  }
  state.slotDuration[s] = d;
  state.slotDuration[s2] = 0;
  state.slotTime[s2] = -1;
  sleep(state, s2);
}

function touchPieces(state, s) {
  const { pieces } = state.layout.slots[s];
  for (let i = 0; i < pieces.length; i += 1) {
    const se = state.layout.pieces[pieces[i]];
    touchEvent(state, se.event);
    for (let k = 0; k < se.resources.length; k += 1) if (se.resources[k] >= 0) touchResource(state, se.resources[k]);
  }
}

/** Cuts awake slot `s` after its first `first` times, into idle slot `s2`. */
export function splitSlot(state, s, s2, first) {
  open(state);
  touchPieces(state, s);
  state.undo.kind = SPLIT;
  state.undo.a = s;
  state.undo.b = s2;
  copyResources(state, s, s2);
  cut(state, s, s2, first);
  return settle(state);
}

/** Joins awake slot `s2` to awake slot `s`, which it follows. */
export function mergeSlots(state, s, s2) {
  open(state);
  touchPieces(state, s);
  touchPieces(state, s2);
  state.undo.kind = MERGE;
  state.undo.a = s;
  state.undo.b = s2;
  state.undo.ta = state.slotDuration[s];
  join(state, s, s2);
  return settle(state);
}
