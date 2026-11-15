import { boardOf, remove } from "../board.js";
import { tryLink } from "../rules/hard.js";
import { linkDelta } from "../rules/soft.js";
import { SLOTS, slotName } from "../time.js";
import { lockLinks } from "./locks.js";

/**
 * Moving a course by hand in the sandbox (docs/modele.md § 14): the slots its barrette may go to, the rest of the
 * timetable as it stands, under every hard constraint (`tryLink`), each with what it adds to the soft cost; then the
 * move itself, which locks the barrette there, so that the next build keeps it. This is how a timetable taken over
 * from elsewhere is entered.
 */

/**
 * The slots barrette `link` may go to, other than its own, the cheapest first.
 * @param {import("../types.js").School} school with the settings on it (`applyEdits`)
 * @param {import("../types.js").Timetable} timetable
 * @param {number} link
 * @returns {{ slot: number, name: string, rooms: number[], delta: number }[]}
 */
export function optionsFor(school, timetable, link) {
  const board = boardOf(school, timetable);
  const ids = school.links[link];
  const from = timetable.slot[ids[0]];
  for (const id of ids) if (from >= 0) remove(board, id);
  const before = from >= 0 ? reCost(board, link, from, ids.map((id) => timetable.room[id])) : 0;
  const options = [];
  for (let slot = 0; slot < SLOTS; slot += 1) {
    if (slot === from || tryLink(board, link, slot) < 0) continue;
    const rooms = Array.from(board.rooms.subarray(0, ids.length));
    options.push({ slot, name: slotName(slot), rooms, delta: linkDelta(board, link, slot) - before });
  }
  return options.sort((a, b) => a.delta - b.delta || a.slot - b.slot);
}

/** The soft cost the barrette had where it stood, in its rooms. */
function reCost(board, link, slot, rooms) {
  for (let i = 0; i < rooms.length; i += 1) board.rooms[i] = rooms[i];
  return linkDelta(board, link, slot);
}

/**
 * The timetable with barrette `link` moved to an option of `optionsFor`, and the settings that lock it there.
 * @param {import("../types.js").Edits} edits
 * @param {import("../types.js").School} school
 * @param {import("../types.js").Timetable} timetable
 * @param {{ link: number, slot: number, rooms: number[] }} move
 */
export function moveLink(edits, school, timetable, { link, slot, rooms }) {
  const moved = { slot: timetable.slot.slice(), room: timetable.room.slice() };
  school.links[link].forEach((id, i) => {
    moved.slot[id] = slot;
    moved.room[id] = rooms[i];
  });
  return { timetable: moved, edits: lockLinks(edits, school, moved, [link]) };
}
