import { moveSlot, moveTask, undo } from "./moves.js";

/**
 * The simple rule of the XHSTT bench (docs/modele.md § 13), the search's yardstick: the awake slots one by one, as the
 * layout first cuts the events, those with the fewest starting times first, then the biggest (pieces × duration);
 * each at its cheapest time given what is already placed. Then the tasks, those with the fewest candidates first, each filled by its cheapest candidate. Ties
 * go to a draw of `rng`, so that the rule can be rerun with other draws. It returns the tries it took (one per time
 * or candidate tried).
 */

/** The order to place things in: by `key`, ties drawn. */
function orderOf(count, key, rng) {
  const draw = Float64Array.from({ length: count }, () => rng.next());
  return Array.from({ length: count }, (_, i) => i).sort((a, b) => key(a) - key(b) || draw[a] - draw[b]);
}

/** Tries every option of `options` through `move`, then makes the cheapest; ties drawn. The tries it took. */
function cheapest(state, { options, move, rng }) {
  let best = -1;
  let bestDelta = Infinity;
  let ties = 0;
  for (let i = 0; i < options.length; i += 1) {
    const delta = move(options[i]);
    undo(state);
    if (delta < bestDelta) [best, bestDelta, ties] = [i, delta, 1];
    else if (delta === bestDelta) {
      ties += 1;
      if (rng.int(ties) === 0) best = i;
    }
  }
  if (best >= 0) move(options[best]);
  return options.length;
}

/**
 * @param {import("./state.js").XState} state a state whose slots and tasks are all empty but the fixed ones
 * @param {{ next(): number, int(n: number): number }} rng
 */
export function greedy(state, rng) {
  const { slots, tasks, units, pieces } = state.layout;
  const live = Array.from(state.live.live.subarray(0, state.live.count));
  const domainOf = (s) => units[slots[s].unit].domainAt(state.slotDuration[s]).domain;
  const bySize = (i) => domainOf(live[i]).length * 1e4 - slots[live[i]].pieces.length * state.slotDuration[live[i]];
  let tries = 0;
  for (const i of orderOf(live.length, bySize, rng)) {
    const s = live[i];
    tries += cheapest(state, { options: domainOf(s), move: (t) => moveSlot(state, s, t), rng });
  }
  const awake = tasks.map((task) => task.targets.some((p, i) => i % 2 === 0 && pieces[p].duration > 0));
  for (const task of orderOf(tasks.length, (k) => tasks[k].candidates.length, rng)) {
    if (awake[task]) tries += cheapest(state, { options: tasks[task].candidates, move: (r) => moveTask(state, task, r), rng });
  }
  return tries;
}
