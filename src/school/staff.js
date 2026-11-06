import { SUBJECTS } from "../grid.js";
import { DAYS, SLOTS, hasLunch, MORNING, weeksOf } from "../time.js";

/**
 * The teachers of a fictitious collège and who teaches which division (the TRS, given to the model: docs/modele.md
 * § 2.3). Every figure here is a hypothesis (H) of the model:
 * - 15 % of the teachers are agrégés (15 h), the others certifiés (18 h); one hour above the service is allowed;
 * - a subject's teachings (a division, or a pair's LV2 group: courses.js) go to its teachers in order, each filled up
 *   to its service;
 * - a teacher left at least 4 h under the service completes it elsewhere: one weekday away (D4);
 * - half of the teachers wish one half-day free (S3).
 */
const AGREGE_SHARE = 0.15;
const PARTIAL_GAP = 4;
const WISH_SHARE = 0.5;

/**
 * The teachings to staff, in the order of the courses: each `need` of courses.js with its subject and its weekly
 * hours, an hour on one week only counting a half.
 * @returns {{ key: string, subject: string, hours: number }[]}
 */
export function needsOf(courses) {
  const needs = new Map();
  for (const course of courses) {
    const need = needs.get(course.need) ?? { key: course.need, subject: course.need.split(":")[0], hours: 0 };
    need.hours += (course.length * weeksOf(course.weeks).length) / 2;
    needs.set(course.need, need);
  }
  return [...needs.values()];
}

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

/** Fills the teachers of one subject, teaching after teaching. */
function staffSubject(needs, subject, { teachers, teacherOf, rng }) {
  let current = null;
  for (const { key, hours } of needs.filter((need) => need.subject === subject)) {
    if (!current || current.load + hours > current.service + 1) current = newTeacher(teachers, subject, rng);
    current.load += hours;
    teacherOf.set(key, current.id);
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
 * @param {{ key: string, subject: string, hours: number }[]} needs from `needsOf`
 * @param {{ services: any, away: any, wishes: any }} rngs one stream each, so that one draw leaves the others alone
 * @returns {{ teachers: import("../types.js").Teacher[], teacherOf: Map<string, number> }} the teacher of each need
 */
export function staff(needs, rngs) {
  const teachers = [];
  const teacherOf = new Map();
  for (const subject of SUBJECTS) staffSubject(needs, subject, { teachers, teacherOf, rng: rngs.services });
  for (const teacher of teachers) {
    if (teacher.load <= teacher.service - PARTIAL_GAP) awayOneDay(teacher, rngs.away);
    if (rngs.wishes.next() < WISH_SHARE) teacher.wish = drawWish(rngs.wishes);
  }
  return { teachers, teacherOf };
}
