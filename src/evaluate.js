import { boardOf } from "./board.js";
import { SIXIEME_DAY } from "./rules/hard.js";
import { breakKept, dayMask, popcount } from "./rules/day.js";
import {
  WEIGHTS,
  awayFromHome,
  divisionHoles,
  epsTooClose,
  lateHeavy,
  longDay,
  repeats,
  teacherHoles,
  wishBroken,
} from "./rules/soft.js";
import { DAYS, WEEKS, fits, hasLunch, weeksOf } from "./time.js";

/**
 * The two costs of a timetable (docs/modele.md § 3), from scratch: what the greedy builds, a search changes, or a
 * page shows is judged here, and only here. Infeasibility first: D1 counts the cells of the courses left unplaced
 * (one per slot and week), D2 the clashes, D3 a room of the wrong kind, D4 a teacher placed while away, D5 a lunch
 * break lost, D6 a 6e day past six hours, D8 a block across a half-day.
 */
const zeros = (keys) => Object.fromEntries(keys.map((key) => [key, 0]));
const cellsOf = (course) => course.length * weeksOf(course.weeks).length;

const clashes = (layer) => layer.count.reduce((sum, n) => sum + Math.max(0, n - 1), 0);

function awayCells(school, course, slot) {
  const away = school.teachers[course.teacher].unavailable;
  let cells = 0;
  for (let k = 0; k < course.length; k += 1) cells += away[slot + k];
  return cells * weeksOf(course.weeks).length;
}

/** D1, D3, D4, D8: course by course. */
function countCourses(board, hard, soft) {
  const { school } = board;
  for (const course of school.courses) {
    const slot = board.slot[course.id];
    if (slot < 0) {
      hard.D1 += cellsOf(course);
      continue;
    }
    const room = board.roomOf[course.id];
    const weeks = weeksOf(course.weeks).length;
    if (school.rooms[room].kind !== course.kind) hard.D3 += cellsOf(course);
    hard.D4 += awayCells(school, course, slot);
    if (!fits(slot, course.length)) hard.D8 += weeks;
    soft.S6 += lateHeavy(course, slot) * weeks;
    soft.S7 += awayFromHome(school, course, room) * weeks;
  }
}

/** D5, D6, S1, S4, S5: a division's day; S8: its week. */
function countDivisions(board, hard, soft) {
  for (const division of board.school.divisions) {
    for (let week = 0; week < WEEKS; week += 1) {
      soft.S8 += epsTooClose(board, division.id, week);
      DAYS.forEach((_, day) => {
        const mask = dayMask(board.division, division.id, week, day);
        if (hasLunch(day) && !breakKept(mask)) hard.D5 += 1;
        if (division.level === 6) hard.D6 += Math.max(0, popcount(mask) - SIXIEME_DAY);
        soft.S1 += divisionHoles(mask, day);
        soft.S4 += repeats(board, division.id, week, day);
        soft.S5 += longDay(mask, division.level);
      });
    }
  }
}

/** S2, S3: a teacher's day. */
function countTeachers(board, soft) {
  for (const teacher of board.school.teachers) {
    for (let week = 0; week < WEEKS; week += 1) {
      DAYS.forEach((_, day) => {
        const mask = dayMask(board.teacher, teacher.id, week, day);
        soft.S2 += teacherHoles(mask, day);
        soft.S3 += wishBroken(teacher, mask, day);
      });
    }
  }
}

/**
 * @param {import("./types.js").School} school
 * @param {import("./types.js").Timetable} timetable
 * @returns {import("./types.js").Evaluation}
 */
export function evaluate(school, timetable) {
  const board = boardOf(school, timetable);
  const hard = zeros(["D1", "D2", "D3", "D4", "D5", "D6", "D8"]);
  const soft = zeros(Object.keys(WEIGHTS));
  hard.D2 = clashes(board.division) + clashes(board.teacher) + clashes(board.room);
  countCourses(board, hard, soft);
  countDivisions(board, hard, soft);
  countTeachers(board, soft);
  const infeasibility = Object.values(hard).reduce((sum, n) => sum + n, 0);
  const cost = Object.entries(soft).reduce((sum, [key, n]) => sum + WEIGHTS[key] * n, 0);
  return { infeasibility, cost, hard, soft };
}
