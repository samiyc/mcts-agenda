/**
 * What each level is taught, read in the arrêtés (docs/recherche/sources.md § 1): the 6e of the arrêté of 7/04/2023,
 * the cycle 4 of the arrêté of 16/06/2017. Weekly hours are written ×2, in half-hours, so that 4,5 h stays a whole
 * number: 9. Every level makes 52 half-hours, 26 h.
 *
 * A reading of ours (H, docs/modele.md § 2.2): the 3 h of « SVT, physique-chimie » of the 6e are split 1,5 h each,
 * like the cycle 4. How the hours become courses, barrettes and half-groups: src/school/courses.js.
 */
/** @type {readonly (6 | 5 | 4 | 3)[]} */
export const LEVELS = Object.freeze([6, 5, 4, 3]);

/** `kind`: the room the discipline needs; `heavy`: kept before 15 h if possible (S6). */
export const DISCIPLINES = Object.freeze({
  fr: Object.freeze({ name: "français", kind: "ordinary", heavy: true }),
  ma: Object.freeze({ name: "mathématiques", kind: "ordinary", heavy: true }),
  lv1: Object.freeze({ name: "LV1", kind: "ordinary", heavy: true }),
  lv2: Object.freeze({ name: "LV2", kind: "ordinary", heavy: false }),
  hg: Object.freeze({ name: "histoire-géographie", kind: "ordinary", heavy: false }),
  svt: Object.freeze({ name: "SVT", kind: "svt", heavy: false }),
  pc: Object.freeze({ name: "physique-chimie", kind: "pc", heavy: false }),
  tech: Object.freeze({ name: "technologie", kind: "tech", heavy: false }),
  arts: Object.freeze({ name: "arts plastiques", kind: "arts", heavy: false }),
  mus: Object.freeze({ name: "éducation musicale", kind: "music", heavy: false }),
  eps: Object.freeze({ name: "EPS", kind: "gym", heavy: false }),
  sout: Object.freeze({ name: "soutien", kind: "ordinary", heavy: false }),
});

/** The two LV2 of the collège, a group each in the barrette of a pair of divisions (H: Spanish and German). */
export const LANGUAGES = Object.freeze(["esp", "all"]);
export const LANGUAGE_NAMES = Object.freeze({ esp: "espagnol", all: "allemand" });

/** What a teacher teaches: a discipline of the grid, an LV2 for the LV2; the soutien goes to français and maths. */
export const SUBJECTS = Object.freeze(["fr", "ma", "lv1", ...LANGUAGES, "hg", "svt", "pc", "tech", "arts", "mus", "eps"]);

const CYCLE_4 = { fr: 9, ma: 7, lv1: 6, lv2: 5, hg: 6, svt: 3, pc: 3, tech: 3, arts: 2, mus: 2, eps: 6 };

/** Half-hours a week, by level and discipline. */
export const GRID = Object.freeze({
  6: Object.freeze({ fr: 9, ma: 9, lv1: 8, hg: 6, svt: 3, pc: 3, arts: 2, mus: 2, eps: 8, sout: 2 }),
  5: Object.freeze({ ...CYCLE_4 }),
  4: Object.freeze({ ...CYCLE_4 }),
  3: Object.freeze({ ...CYCLE_4, fr: 8, hg: 7 }),
});

/**
 * The courses of one division in one discipline, from its half-hours: a 1 h course on both weeks per hour, and an odd
 * half-hour as a 1 h course on one week only, A or B by `parity`. EPS goes in 2 h blocks (Sami, 6/11/2026: « plutôt
 * deux fois 2 h »): 4 h make two blocks on both weeks; the 3 h of the cycle 4, one block on both weeks and one on a
 * single week.
 * @returns {{ length: 1 | 2, weeks: "AB" | "A" | "B" }[]}
 */
export function piecesOf(discipline, halfHours, parity) {
  const length = discipline === "eps" ? 2 : 1;
  const whole = 2 * length;
  /** @type {{ length: 1 | 2, weeks: "AB" | "A" | "B" }[]} */
  const pieces = Array.from({ length: Math.floor(halfHours / whole) }, () => ({ length, weeks: "AB" }));
  if (halfHours % whole) pieces.push({ length, weeks: parity ? "B" : "A" });
  return pieces;
}
