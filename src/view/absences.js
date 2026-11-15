import { drawWeek } from "../absence/scenario.js";
import { scenarioOf } from "../sandbox/edits.js";
import { DAYS } from "../time.js";
import { namesOf } from "./week.js";

/**
 * The absences chosen by hand on the replacement page (docs/modele.md § 14), decided here so that it is tested: the
 * list in words, an absence added or taken off, a drawn week to start from, the volunteers and their hours. Settings
 * in, new settings out; `runWeek` plays them through `scenarioOf`.
 */
export const KNOWN_NAMES = Object.freeze({ veille: "prévenue la veille", matin: "apprise le matin même" });
export const TOLD_NAMES = Object.freeze({ whole: "durée connue", daily: "apprise jour après jour" });

const daysText = (a) => (a.from === a.to ? `le ${DAYS[a.from].name}` : `du ${DAYS[a.from].name} au ${DAYS[a.to].name}`);

/** Each absence in words. */
export function absenceLines(school, edits) {
  const names = namesOf(school);
  return edits.absences.map((a) => `${names.teacher[a.teacher]}, absent ${daysText(a)}, ${KNOWN_NAMES[a.known]}, ${TOLD_NAMES[a.told]}`);
}

/** Settings with one absence more; the days put in order, an absence that overlaps the teacher's others refused. */
export function addAbsence(edits, absence) {
  const a = { ...absence, from: Math.min(absence.from, absence.to), to: Math.max(absence.from, absence.to) };
  const overlaps = edits.absences.some((b) => b.teacher === a.teacher && b.from <= a.to && a.from <= b.to);
  if (overlaps) return { edits, error: "ce professeur est déjà absent l'un de ces jours" };
  return { edits: { ...edits, absences: [...edits.absences, a].sort((x, y) => x.from - y.from || x.teacher - y.teacher) }, error: "" };
}

export const removeAbsence = (edits, index) => ({ ...edits, absences: edits.absences.filter((_, i) => i !== index) });

/** Settings whose absences and week are those the measures draw for that seed (`drawWeek`), to start from. */
export function withDrawn(edits, school, seed) {
  const drawn = drawWeek(school, seed);
  const absences = drawn.absences.map(({ teacher, from, to, known, told }) => ({ teacher, from, to, known, told }));
  return { ...edits, absences, week: drawn.week };
}

/** Each teacher with the hours he may give this week: the collège's volunteers, or the ones set by hand. */
export function volunteerRows(school, edits) {
  const { budget } = scenarioOf(school, edits);
  const names = namesOf(school);
  return school.teachers.map((t) => ({ teacher: t.id, name: names.teacher[t.id], hours: budget[t.id] }));
}

/** Settings where `teacher` gives `hours`; the collège's other volunteers are kept as they were. */
export function setVolunteer(edits, school, teacher, hours) {
  const { budget } = scenarioOf(school, edits);
  const volunteers = {};
  budget.forEach((h, t) => {
    if (h > 0) volunteers[t] = h;
  });
  const h = Math.max(0, Math.floor(hours) || 0);
  if (h > 0) volunteers[teacher] = h;
  else delete volunteers[teacher];
  return { ...edits, volunteers };
}
