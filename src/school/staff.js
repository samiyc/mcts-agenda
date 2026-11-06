import { DISCIPLINES, GRID } from "../grid.js";
import { DAYS, SLOTS, hasLunch, MORNING } from "../time.js";

/**
 * The teachers of a fictitious collège and who teaches which division (the TRS, given to the model: docs/modele.md
 * § 2.3). Every figure here is a hypothesis (H) of the model:
 * - 15 % of the teachers are agrégés (15 h), the others certifiés (18 h); one hour above the service is allowed;
 * - a discipline's divisions go to its teachers in order, each filled up to its service;
 * - a teacher left at least 4 h under the service completes it elsewhere: one weekday away (D4);
 * - half of the teachers wish one half-day free (S3).
 */
const AGREGE_SHARE = 0.15;
const PARTIAL_GAP = 4;
const WISH_SHARE = 0.5;

/** Weekly hours of a division in a discipline; the soutien of the 6e rides with mathematics. */
function hoursOf(level, discipline) {
  const grid = GRID[level];
  const own = (grid[discipline] ?? 0) / 2;
  return discipline === "ma" ? own + (grid.sout ?? 0) / 2 : own;
}

const STAFFED = Object.keys(DISCIPLINES).filter((key) => !DISCIPLINES[key].taughtBy);

function newTeacher(teachers, discipline, rng) {
  const teacher = {
    id: teachers.length,
    discipline,
    service: rng.next() < AGREGE_SHARE ? 15 : 18,
    load: 0,
    unavailable: new Uint8Array(SLOTS),
    wish: null,
  };
  teachers.push(teacher);
  return teacher;
}

/** Fills the teachers of one discipline, division after division. */
function staffDiscipline(divisions, discipline, { teachers, teacherOf, rng }) {
  let current = null;
  for (const division of divisions) {
    const hours = hoursOf(division.level, discipline);
    if (hours === 0) continue;
    if (!current || current.load + hours > current.service + 1) current = newTeacher(teachers, discipline, rng);
    current.load += hours;
    teacherOf.set(`${division.id}:${discipline}`, current.id);
  }
}

/** A weekday with an afternoon, all its slots away. */
function awayOneDay(teacher, rng) {
  const weekdays = DAYS.map((day, index) => index).filter((index) => hasLunch(index));
  const day = DAYS[weekdays[rng.int(weekdays.length)]];
  teacher.unavailable.fill(1, day.first, day.first + day.count);
}

function drawWish(rng) {
  const day = rng.int(DAYS.length);
  const half = DAYS[day].count > MORNING ? rng.int(2) : 0;
  return { day, half };
}

/**
 * @param {import("../types.js").Division[]} divisions
 * @param {{ services: any, away: any, wishes: any }} rngs one stream each, so that one draw leaves the others alone
 * @returns {{ teachers: import("../types.js").Teacher[], teacherOf: Map<string, number> }}
 */
export function staff(divisions, rngs) {
  const teachers = [];
  const teacherOf = new Map();
  for (const discipline of STAFFED) staffDiscipline(divisions, discipline, { teachers, teacherOf, rng: rngs.services });
  for (const teacher of teachers) {
    if (teacher.load <= teacher.service - PARTIAL_GAP) awayOneDay(teacher, rngs.away);
    if (rngs.wishes.next() < WISH_SHARE) teacher.wish = drawWish(rngs.wishes);
  }
  return { teachers, teacherOf };
}

/** The teacher of a division in a discipline, through `taughtBy` for the soutien. */
export function teacherFor(teacherOf, division, discipline) {
  const by = DISCIPLINES[discipline].taughtBy ?? discipline;
  return teacherOf.get(`${division}:${by}`);
}
