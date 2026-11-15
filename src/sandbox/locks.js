/**
 * The sandbox's locks (docs/modele.md § 14), taken or let go a barrette at a time: locking a division's week locks
 * every barrette one of its courses belongs to, where the timetable shown has it, rooms included; a barrette shared
 * with another division (an LV2 group) is locked for both. Settings in, new settings out: nothing is changed in place.
 */

/** The barrettes with a course of division `division`. */
export function linksOfDivision(school, division) {
  const links = new Set();
  for (const course of school.courses) if (course.divisions.includes(division)) links.add(course.link);
  return [...links].sort((a, b) => a - b);
}

/**
 * Settings with barrettes `links` locked where `timetable` has them; one left unplaced is not locked.
 * @param {import("../types.js").Edits} edits
 * @param {import("../types.js").School} school
 * @param {import("../types.js").Timetable} timetable
 * @param {number[]} links
 * @returns {import("../types.js").Edits}
 */
export function lockLinks(edits, school, timetable, links) {
  const locks = { ...edits.locks };
  for (const link of links) {
    const ids = school.links[link];
    if (timetable.slot[ids[0]] < 0) continue;
    for (const id of ids) locks[id] = { slot: timetable.slot[id], room: timetable.room[id] };
  }
  return { ...edits, locks };
}

/** Settings with barrettes `links` free again. */
export function unlockLinks(edits, school, links) {
  const locks = { ...edits.locks };
  for (const link of links) for (const id of school.links[link]) delete locks[id];
  return { ...edits, locks };
}

export const lockDivision = (edits, school, timetable, division) => lockLinks(edits, school, timetable, linksOfDivision(school, division));
export const unlockDivision = (edits, school, division) => unlockLinks(edits, school, linksOfDivision(school, division));

/** Whether course `id` is locked. */
export const isLocked = (edits, id) => Boolean(edits.locks[id]);

/** How many of division `division`'s courses are locked, out of how many. */
export function lockedCount(edits, school, division) {
  const ids = school.courses.filter((course) => course.divisions.includes(division)).map((course) => course.id);
  return { locked: ids.filter((id) => isLocked(edits, id)).length, of: ids.length };
}
