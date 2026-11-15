import { boardOf, remove } from "../board.js";
import { evaluate } from "../evaluate.js";
import { placeLink, tryLink } from "../rules/hard.js";
import { linkDelta } from "../rules/soft.js";
import { weeksOf } from "../time.js";

/**
 * A timetable under search (docs/modele.md § 7): its board, the slot of each barrette and the room of each course as
 * they stand, and the two costs, kept up to date move by move.
 *
 * A move lifts barrettes off the board (`lift`), tries them elsewhere (`costAt`, `drop`), then keeps the new places
 * (`commit`) or puts them back (`unput`, `back`). Every change of cost is read by `linkDelta` on the days a barrette
 * touches, and the tests check the running sum against `evaluate`. A barrette goes only where `tryLink` lets it, so a
 * move never breaks a hard constraint: the infeasibility only falls, when a barrette that R0 left finds a slot.
 */

const cellsOf = (school, link) => school.links[link].reduce((sum, id) => sum + school.courses[id].length * weeksOf(school.courses[id].weeks).length, 0);

/**
 * @param {import("../types.js").School} school
 * @param {import("../types.js").Timetable} timetable hard-feasible but for unplaced barrettes, as R0 leaves it
 */
export function createState(school, timetable) {
  const { infeasibility, cost } = evaluate(school, timetable);
  const at = Int16Array.from(school.links, (ids) => timetable.slot[ids[0]]);
  const locked = Uint8Array.from(school.links, (ids) => (school.courses[ids[0]].fixed ? 1 : 0));
  const waiting = [];
  at.forEach((slot, link) => {
    if (slot < 0 && !locked[link]) waiting.push(link);
  });
  return { school, board: boardOf(school, timetable), at, room: timetable.room.slice(), infeasibility, cost, waiting, locked };
}

/** Whether a search may move barrette `link`: placed, and not locked by the sandbox (`Course.fixed`). */
export const movable = (state, link) => state.at[link] >= 0 && state.locked[link] === 0;

/** @typedef {ReturnType<typeof createState>} State */

function setRooms(state, link) {
  const ids = state.school.links[link];
  for (let i = 0; i < ids.length; i += 1) state.board.rooms[i] = state.room[ids[i]];
}

/** Takes placed barrette `link` off the board: the cost its days had with it, which the move saves. */
export function lift(state, link) {
  const ids = state.school.links[link];
  setRooms(state, link);
  for (let i = 0; i < ids.length; i += 1) remove(state.board, ids[i]);
  return linkDelta(state.board, link, state.at[link]);
}

/** The cost lifted barrette `link` would add at `slot`, or NaN when it cannot start there. */
export function costAt(state, link, slot) {
  return tryLink(state.board, link, slot) < 0 ? NaN : linkDelta(state.board, link, slot);
}

/** Puts lifted barrette `link` at `slot`, where `costAt` found it may go. */
export function drop(state, link, slot) {
  tryLink(state.board, link, slot);
  placeLink(state.board, link, slot);
}

/** Takes a dropped barrette off again, before putting it back. */
export function unput(state, link) {
  const ids = state.school.links[link];
  for (let i = 0; i < ids.length; i += 1) remove(state.board, ids[i]);
}

/** Puts lifted barrette `link` back where it stands. */
export function back(state, link) {
  setRooms(state, link);
  placeLink(state.board, link, state.at[link]);
}

/** Makes the slot where barrette `link` was dropped its own, and its rooms. */
export function commit(state, link, slot) {
  state.at[link] = slot;
  const ids = state.school.links[link];
  for (let i = 0; i < ids.length; i += 1) state.room[ids[i]] = state.board.roomOf[ids[i]];
}

/** Tries a barrette R0 left at `slot`: placed and kept when it fits, which nothing outweighs (infeasibility first). */
export function insert(state, index, slot) {
  const link = state.waiting[index];
  const delta = costAt(state, link, slot);
  if (Number.isNaN(delta)) return false;
  drop(state, link, slot);
  commit(state, link, slot);
  state.cost += delta;
  state.infeasibility -= cellsOf(state.school, link);
  state.waiting.splice(index, 1);
  return true;
}

/**
 * The barrettes each barrette shares a division or a teacher with: the partners of a swap, the ones whose days it
 * changes.
 * @param {import("../types.js").School} school
 */
export function neighboursOf(school) {
  const byKey = new Map();
  const keysOf = (link) => school.links[link].flatMap((id) => [...school.courses[id].divisions.map((d) => `d${d}`), `t${school.courses[id].teacher}`]);
  school.links.forEach((_, link) => {
    for (const key of keysOf(link)) byKey.set(key, [...(byKey.get(key) ?? []), link]);
  });
  return school.links.map((_, link) => {
    const near = new Set(keysOf(link).flatMap((key) => byKey.get(key)));
    near.delete(link);
    return Int16Array.from([...near].sort((a, b) => a - b));
  });
}
