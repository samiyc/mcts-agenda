import { ABSENCES, volunteersOf } from "../absence/scenario.js";
import { WEIGHTS } from "../rules/soft.js";
import { DAYS, SLOTS, WEEKS } from "../time.js";

/**
 * The sandbox's settings (docs/modele.md § 14): what Sami changes by hand on a collège drawn from its size and seed,
 * kept as plain JSON (the browser keeps it, a file carries it). Nothing here changes the model: `applyEdits` makes a
 * copy of the collège with the settings on it, and empty settings give the collège back as it was drawn.
 * - `weights`: the soft weights changed (S1 to S8), the others as `WEIGHTS`;
 * - `teachers`: by teacher, the slots where he is elsewhere (`away`, hard, D4) or would rather not come (`avoid`,
 *   soft, counted with his wish in S3), and the most hours he teaches in a day (`dayMax`, hard, D10);
 * - `divisions`: by division, the slots where it is to have no lesson (`away`, hard, D11);
 * - `rooms`: by course, the room imposed on it (hard, D3), of the course's kind;
 * - `locks`: by course, where it stays (`slot`, `room`); a barrette is locked whole or not at all;
 * - `absences`, `week`, `volunteers`: a week of absences chosen by hand, the week A or B, the hours each volunteer
 *   gives (`null`: the collège's volunteers, `ABSENCES.hours` each).
 */
export const EDITS_VERSION = 1;
const KNOWN = ["veille", "matin"];
const TOLD = ["whole", "daily"];

/** @returns {import("../types.js").Edits} */
export const emptyEdits = (size, seed) => ({ version: EDITS_VERSION, size, seed, weights: {}, teachers: {}, divisions: {}, rooms: {}, locks: {}, absences: [], week: 0, volunteers: null });
/** The most hours a day a teacher can be held to: a day has eight slots. */
export const DAY_MAX = Object.freeze({ low: 1, high: 8 });

const fail = (message) => {
  throw new Error(message);
};
const isIndex = (value, length) => Number.isInteger(value) && value >= 0 && value < length;
const check = (ok, message) => ok || fail(message);
const entries = (value) => (value && typeof value === "object" ? Object.entries(value) : []);

function readWeights(weights) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const [key, value] of entries(weights)) {
    check(key in WEIGHTS, `poids inconnu : ${key}`);
    check(Number.isFinite(value) && value >= 0, `le poids de ${key} doit être un nombre positif ou nul`);
    out[key] = value;
  }
  return out;
}

const readSlots = (slots, what) => {
  const list = Array.isArray(slots) ? slots : [];
  for (const slot of list) check(isIndex(slot, SLOTS), `${what} : créneau ${slot} hors de la semaine`);
  return [...new Set(list)].sort((a, b) => a - b);
};

function readTeachers(teachers, school) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const [key, value] of entries(teachers)) {
    check(isIndex(Number(key), school.teachers.length), `professeur inconnu : ${key}`);
    out[key] = { away: readSlots(value.away, `professeur ${key}`), avoid: readSlots(value.avoid, `professeur ${key}`) };
    if (value.dayMax !== undefined) {
      check(Number.isInteger(value.dayMax) && value.dayMax >= DAY_MAX.low && value.dayMax <= DAY_MAX.high, `professeur ${key} : de 1 à 8 heures par jour`);
      out[key].dayMax = value.dayMax;
    }
  }
  return out;
}

function readDivisions(divisions, school) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const [key, value] of entries(divisions)) {
    check(isIndex(Number(key), school.divisions.length), `classe inconnue : ${key}`);
    out[key] = { away: readSlots(value.away, `classe ${key}`) };
  }
  return out;
}

/** The rooms imposed, each of its course's kind. */
function readRooms(rooms, school) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const [key, room] of entries(rooms)) {
    check(isIndex(Number(key), school.courses.length), `cours inconnu : ${key}`);
    check(isIndex(room, school.rooms.length), `salle inconnue pour le cours ${key} : ${room}`);
    check(school.rooms[room].kind === school.courses[Number(key)].kind, `la salle imposée au cours ${key} n'est pas du type du cours`);
    out[key] = room;
  }
  return out;
}

/** A lock on every course of a barrette, all at one slot, in rooms that exist. */
function readLocks(locks, school) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const [key, value] of entries(locks)) {
    check(isIndex(Number(key), school.courses.length), `cours inconnu : ${key}`);
    check(isIndex(value?.slot, SLOTS) && isIndex(value?.room, school.rooms.length), `verrou du cours ${key} mal formé`);
    out[key] = { slot: value.slot, room: value.room };
  }
  return out;
}

/** Locks whose room is not the one imposed on their course: refused. */
function lockRoomsKept(locks, rooms) {
  for (const [key, lock] of Object.entries(locks)) {
    check(rooms[key] === undefined || rooms[key] === lock.room, `le cours ${key} est verrouillé dans une autre salle que celle imposée`);
  }
  return locks;
}

function lockLinksWhole(out, school) {
  for (const key of Object.keys(out)) {
    const ids = school.links[school.courses[Number(key)].link];
    check(
      ids.every((id) => out[id]?.slot === out[key].slot),
      `verrou incomplet : la barrette du cours ${key} doit être verrouillée entière, au même créneau`,
    );
  }
  return out;
}

function readAbsence(a, school) {
  check(isIndex(a?.teacher, school.teachers.length), `absence : professeur inconnu (${a?.teacher})`);
  check(isIndex(a.from, DAYS.length) && isIndex(a.to, DAYS.length) && a.from <= a.to, "absence : jours mal formés");
  check(KNOWN.includes(a.known) && TOLD.includes(a.told ?? "whole"), "absence : « veille » ou « matin », « whole » ou « daily »");
  return { teacher: a.teacher, from: a.from, to: a.to, known: a.known, told: a.told ?? "whole" };
}

function readVolunteers(volunteers, school) {
  if (volunteers === null || volunteers === undefined) return null;
  /** @type {Record<string, any>} */
  const out = {};
  for (const [key, hours] of entries(volunteers)) {
    check(isIndex(Number(key), school.teachers.length), `volontaire inconnu : ${key}`);
    check(Number.isInteger(hours) && hours >= 0, `les heures du volontaire ${key} doivent être un entier positif`);
    out[key] = hours;
  }
  return out;
}

/**
 * Settings read back (from the browser or a file) for `school`, completed by default; an Error in French when
 * something does not fit the collège.
 * @param {any} value
 * @param {import("../types.js").School} school
 * @returns {import("../types.js").Edits}
 */
export function readEdits(value, school) {
  check(value && typeof value === "object", "ce n'est pas un fichier de réglages");
  check(value.version === EDITS_VERSION, `version de réglages inconnue : ${value.version}`);
  check(value.size === school.size && value.seed === school.seed, `ces réglages sont ceux du collège ${value.size}, graine ${value.seed}`);
  return {
    version: EDITS_VERSION,
    size: value.size,
    seed: value.seed,
    weights: readWeights(value.weights),
    teachers: readTeachers(value.teachers, school),
    divisions: readDivisions(value.divisions, school),
    rooms: readRooms(value.rooms, school),
    locks: lockRoomsKept(lockLinksWhole(readLocks(value.locks, school), school), readRooms(value.rooms, school)),
    absences: (Array.isArray(value.absences) ? value.absences : []).map((a) => readAbsence(a, school)),
    week: isIndex(value.week, WEEKS) ? value.week : 0,
    volunteers: readVolunteers(value.volunteers, school),
  };
}

function teacherWith(teacher, edit) {
  if (!edit) return teacher;
  const unavailable = teacher.unavailable.slice();
  for (const slot of edit.away) unavailable[slot] = 1;
  const avoid = new Uint8Array(SLOTS);
  for (const slot of edit.avoid) avoid[slot] = 1;
  return { ...teacher, unavailable, avoid, ...(edit.dayMax === undefined ? {} : { dayMax: edit.dayMax }) };
}

function divisionWith(division, edit) {
  if (!edit) return division;
  const away = new Uint8Array(SLOTS);
  for (const slot of edit.away) away[slot] = 1;
  return { ...division, away };
}

function courseWith(course, edits) {
  const lock = edits.locks[course.id];
  const room = edits.rooms?.[course.id];
  if (!lock && room === undefined) return course;
  return { ...course, ...(lock ? { fixed: { ...lock } } : {}), ...(room === undefined ? {} : { onlyRoom: room }) };
}

/**
 * A copy of `school` with the settings on it: the weights, the teachers' slots away and avoided and their day caps,
 * the divisions' slots kept from lessons, the locked courses' places (`fixed`) and the rooms imposed (`onlyRoom`).
 * The drawn collège is left as it was.
 * @param {import("../types.js").School} school
 * @param {import("../types.js").Edits} edits
 * @returns {import("../types.js").School}
 */
export function applyEdits(school, edits) {
  const weights = { ...WEIGHTS, ...edits.weights };
  const teachers = school.teachers.map((teacher) => teacherWith(teacher, edits.teachers[teacher.id]));
  const divisions = school.divisions.map((division) => divisionWith(division, edits.divisions?.[division.id]));
  const courses = school.courses.map((course) => courseWith(course, edits));
  return { ...school, weights, teachers, divisions, courses };
}

/**
 * The week of absences the settings choose, in the shape of `drawWeek` (`src/absence/scenario.js`), so that
 * `runWeek` plays it as it plays a drawn one. An absence learned day after day reveals each further day the evening
 * before (J6).
 * @param {import("../types.js").School} school
 * @param {import("../types.js").Edits} edits
 */
export function scenarioOf(school, edits) {
  const drawn = volunteersOf(school);
  const budget = Uint8Array.from(school.teachers, (_, t) => (edits.volunteers ? (edits.volunteers[t] ?? 0) : drawn[t] * ABSENCES.hours));
  const absences = edits.absences.map((a) => ({ ...a }));
  return { seed: edits.seed, week: edits.week, budget, absences, hidden: /** @type {"veille"} */ ("veille") };
}
