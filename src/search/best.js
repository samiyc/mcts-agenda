/**
 * The best timetable a search has met, infeasibility first, then the cost; copied into arrays made once, so that
 * keeping it allocates nothing.
 */
export function startBest(state) {
  const { board } = state;
  return { slot: board.slot.slice(), room: board.roomOf.slice(), infeasibility: state.infeasibility, cost: state.cost };
}

export const better = (a, b) => a.infeasibility < b.infeasibility || (a.infeasibility === b.infeasibility && a.cost < b.cost);

/** Keeps the state when it beats the best: true then. */
export function keepBest(best, state) {
  if (!better(state, best)) return false;
  best.slot.set(state.board.slot);
  best.room.set(state.board.roomOf);
  best.infeasibility = state.infeasibility;
  best.cost = state.cost;
  return true;
}

/**
 * @returns {{ timetable: import("../types.js").Timetable, infeasibility: number, cost: number, tries: number }}
 */
export const resultOf = (best, tries) => ({ timetable: { slot: best.slot, room: best.room }, infeasibility: best.infeasibility, cost: best.cost, tries });
