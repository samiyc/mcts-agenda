import { place, remove } from "../board.js";
import { reasonOf, roomFree, tryLink } from "../rules/hard.js";
import { linkDelta } from "../rules/soft.js";

/**
 * The barrettes the sandbox locks (`Course.fixed`, src/sandbox/edits.js), put on the board before anything else, each
 * at its slot and in its rooms. One that cannot go there any more (its teacher now away, a room taken by another
 * lock, a room of the wrong kind) stays unplaced, with why: the rules place nothing else for it, and no search moves
 * it, so that a lock in conflict shows rather than moves.
 */

/** The fixed rooms of `link`'s courses, put on the board one by one: true when all went in, else none stays. */
function putRooms(board, link, slot) {
  const { courses, rooms } = board.school;
  const ids = board.school.links[link];
  for (let i = 0; i < ids.length; i += 1) {
    const course = courses[ids[i]];
    const room = course.fixed.room;
    if (rooms[room].kind !== course.kind || !roomFree(board, room, course, slot)) {
      for (let k = 0; k < i; k += 1) remove(board, ids[k]);
      return false;
    }
    place(board, ids[i], slot, room);
  }
  return true;
}

/** The soft cost locked barrette `link` adds at its slot, its rooms written for `linkDelta`. */
function costOf(board, link, slot) {
  const ids = board.school.links[link];
  for (let i = 0; i < ids.length; i += 1) board.rooms[i] = board.school.courses[ids[i]].fixed.room;
  return linkDelta(board, link, slot);
}

/** Why locked barrette `link` cannot go to its slot, or "" when it can. */
function refusal(board, link, slot) {
  const code = tryLink(board, link, slot);
  return code < 0 ? reasonOf(code) : "";
}

/**
 * @param {ReturnType<typeof import("../board.js").createBoard>} board an empty board
 * @returns {{ done: Set<number>, unplaced: { link: number, courses: number[], reasons: Record<string, number>, locked?: true }[], added: number }}
 *   the locked barrettes, placed or not; those left, with their reason; the soft cost the placed ones add
 */
export function placeLocked(board) {
  const { school } = board;
  const done = new Set();
  const unplaced = [];
  let added = 0;
  school.links.forEach((ids, link) => {
    const fixed = school.courses[ids[0]].fixed;
    if (!fixed) return;
    done.add(link);
    const why = refusal(board, link, fixed.slot);
    const delta = why ? 0 : costOf(board, link, fixed.slot);
    if (!why && putRooms(board, link, fixed.slot)) added += delta;
    else unplaced.push({ link, courses: ids, reasons: { [why || "room"]: 1 }, locked: /** @type {true} */ (true) });
  });
  return { done, unplaced, added };
}
