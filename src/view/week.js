import { DISCIPLINES, LANGUAGE_NAMES } from "../grid.js";
import { SLOTS, WEEKS, weeksOf } from "../time.js";

/**
 * What the page shows of a timetable (docs/modele.md § 10), computed here so that it is tested: the names of the
 * divisions, teachers and rooms, and the week of one of them, A and B, slot by slot. The page only draws it.
 * The teachers have no names: their subject and a number (« français 2 »), as the model has no real person.
 */
export const VIEWS = Object.freeze({ division: "Une division", teacher: "Un professeur", room: "Une salle" });

const NAMES = new WeakMap();
const subjectName = (key) => DISCIPLINES[key]?.name ?? LANGUAGE_NAMES[key];

/** @param {import("../types.js").School} school */
export function namesOf(school) {
  let names = NAMES.get(school);
  if (!names) {
    const count = {};
    const teacher = school.teachers.map(({ discipline }) => {
      count[discipline] = (count[discipline] ?? 0) + 1;
      return `${subjectName(discipline)} ${count[discipline]}`;
    });
    names = { division: school.divisions.map((d) => d.name), teacher, room: school.rooms.map((r) => r.name) };
    NAMES.set(school, names);
  }
  return names;
}

/** The choices of a view, in order: `{ id, name }`. */
export const choicesOf = (school, kind) => namesOf(school)[kind].map((name, id) => ({ id, name }));

/** A course's title: its discipline, with the LV2's language and the soutien's subject. */
export function titleOf(school, course) {
  const name = DISCIPLINES[course.discipline].name;
  if (course.discipline !== "lv2" && course.discipline !== "sout") return name;
  return `${name} ${subjectName(school.teachers[course.teacher].discipline)}`;
}

/** Who takes a course: a division, a half of it, or a group across a pair. */
export function pupilsOf(school, course) {
  const divisions = course.divisions.map((d) => school.divisions[d].name).join(" et ");
  return course.halves === 3 ? divisions : `${divisions}, groupe ${course.halves}`;
}

function shows(course, room, { kind, id }) {
  if (kind === "division") return course.divisions.includes(id);
  return kind === "teacher" ? course.teacher === id : room === id;
}

/** The two other things a view says about a course: the teacher and the room, the pupils and the room... */
function detailOf(school, course, room, kind) {
  const names = namesOf(school);
  const parts = {
    division: [names.teacher[course.teacher], names.room[room]],
    teacher: [pupilsOf(school, course), names.room[room]],
    room: [pupilsOf(school, course), names.teacher[course.teacher]],
  }[kind];
  return parts.join(" · ");
}

/**
 * The week of one division, teacher or room: for each of the weeks A and B, each of the 40 slots, what is there.
 * An entry is `{ course, discipline, title, group, detail, first }`; `first` is false on the second hour of a block;
 * `locked` is there, true, on a course the sandbox locks.
 * @param {import("../types.js").School} school
 * @param {import("../types.js").Timetable} timetable
 * @param {{ kind: "division" | "teacher" | "room", id: number }} view
 */
export function weekOf(school, timetable, view) {
  const cells = Array.from({ length: WEEKS }, () => Array.from({ length: SLOTS }, () => []));
  for (const course of school.courses) {
    const [slot, room] = [timetable.slot[course.id], timetable.room[course.id]];
    if (slot < 0 || !shows(course, room, view)) continue;
    const entry = {
      course: course.id,
      discipline: course.discipline,
      title: titleOf(school, course),
      group: view.kind === "division" && course.halves !== 3 ? `groupe ${course.halves}` : "",
      detail: detailOf(school, course, room, view.kind),
      ...(course.fixed ? { locked: true } : {}),
    };
    spread(cells, course, slot, entry);
  }
  return cells;
}

/** An entry on each hour and week of its course. */
function spread(cells, course, slot, entry) {
  for (const week of weeksOf(course.weeks)) {
    for (let k = 0; k < course.length; k += 1) cells[week][slot + k].push({ ...entry, first: k === 0 });
  }
}
