import { WEIGHTS } from "../rules/soft.js";
import { namesOf, pupilsOf, titleOf } from "./week.js";

/**
 * The costs of a timetable as the page lists them (docs/modele.md § 3): each hard constraint with its count, each
 * soft one with its count, its weight and what it costs; and the barrettes left unplaced, with why.
 */
export const HARD_LABELS = Object.freeze({
  D1: "créneaux non placés (un par heure et par semaine)",
  D2: "un professeur, des élèves ou une salle à deux endroits",
  D3: "une salle du mauvais type, ou pas celle imposée",
  D4: "un professeur placé quand il est ailleurs",
  D5: "une pause méridienne perdue",
  D6: "plus de 6 h dans une journée de 6e",
  D8: "un bloc à cheval sur deux demi-journées",
  D9: "un cours de barrette hors du créneau des autres",
  D10: "un professeur au-delà de ses heures de la journée (6 h en EPS)",
  D11: "un cours d'une classe sur un créneau où elle ne doit pas en avoir",
});

export const SOFT_LABELS = Object.freeze({
  S1: "les trous des élèves",
  S2: "les trous des professeurs",
  S3: "les vœux de demi-journée non tenus",
  S4: "une discipline deux fois le même jour",
  S5: "plus de 7 h dans une journée de cycle 4",
  S6: "français, maths ou LV1 après 15 h",
  S7: "un cours hors de la salle attitrée",
  S8: "deux séances d'EPS à moins de 24 h",
  S9: "une heure sans collègue de la matière libre pour remplacer",
});

export const REASON_LABELS = Object.freeze({
  "half-day": "le bloc sortirait de la demi-journée",
  unavailable: "le professeur est dans un autre établissement",
  division: "les élèves ont déjà cours",
  teacher: "le professeur a déjà cours",
  pause: "la pause méridienne serait perdue",
  "day-limit": "la journée de 6e dépasserait 6 h",
  room: "aucune salle du bon type n'est libre",
  "teacher-day": "le professeur dépasserait ses heures de la journée (6 h en EPS)",
  "division-away": "la classe ne doit pas avoir cours à ce créneau",
});

/**
 * @param {import("../types.js").Evaluation} evaluation
 * @param {Record<string, number>} [weights] the collège's (`weightsOf`), when the sandbox changes them
 */
export function costRows(evaluation, weights = WEIGHTS) {
  return {
    hard: Object.entries(evaluation.hard).map(([key, count]) => ({ key, label: HARD_LABELS[key], count })),
    soft: Object.entries(evaluation.soft).map(([key, count]) => ({
      key,
      label: SOFT_LABELS[key],
      count,
      weight: weights[key],
      cost: weights[key] * count,
    })),
  };
}

/** Why each barrette left unplaced could start nowhere, the most frequent reason first. */
export function unplacedRows(school, unplaced) {
  const names = namesOf(school);
  return unplaced.flatMap(({ courses, reasons }) => {
    const why = Object.entries(reasons)
      .sort(([, a], [, b]) => b - a)
      .map(([reason, slots]) => `${REASON_LABELS[reason]} (${slots} créneaux)`)
      .join(", ");
    return courses.map((id) => {
      const course = school.courses[id];
      return { course: id, title: titleOf(school, course), pupils: pupilsOf(school, course), teacher: names.teacher[course.teacher], why };
    });
  });
}
