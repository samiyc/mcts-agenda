import { back, commit, costAt, drop, lift, unput } from "./state.js";

/**
 * The two moves of the searches, on a state (`state.js`): a barrette to another slot, and two barrettes exchanging
 * their slots. Each is first priced, the board left as it was (NaN when a hard constraint forbids it), then made.
 * Pricing and making read the same days, so the price is exactly the change the move makes.
 */

/** What moving placed barrette `link` to `slot` costs, or NaN. */
export function shiftDelta(state, link, slot) {
  const saved = lift(state, link);
  const delta = costAt(state, link, slot) - saved;
  back(state, link);
  return delta;
}

/** Moves barrette `link` to `slot`, priced `delta` by `shiftDelta`. */
export function makeShift(state, link, slot, delta) {
  lift(state, link);
  drop(state, link, slot);
  commit(state, link, slot);
  state.cost += delta;
}

/** What placed barrettes `a` and `b`, at different slots, exchanging their slots costs, or NaN. */
export function swapDelta(state, a, b) {
  const sa = state.at[a];
  const sb = state.at[b];
  const saved = lift(state, a) + lift(state, b);
  let delta = costAt(state, a, sb);
  if (!Number.isNaN(delta)) {
    drop(state, a, sb);
    delta += costAt(state, b, sa) - saved;
    unput(state, a);
  }
  back(state, a);
  back(state, b);
  return delta;
}

/** Exchanges the slots of barrettes `a` and `b`, priced `delta` by `swapDelta`. */
export function makeSwap(state, a, b, delta) {
  const sa = state.at[a];
  const sb = state.at[b];
  lift(state, a);
  lift(state, b);
  drop(state, a, sb);
  drop(state, b, sa);
  commit(state, a, sb);
  commit(state, b, sa);
  state.cost += delta;
}
