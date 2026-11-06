import { DISCIPLINES, GRID, LANGUAGES, piecesOf } from "../grid.js";

/**
 * How the hours of each division become courses and barrettes (docs/modele.md § 2.4). Every choice here is a
 * hypothesis (H, Q-P4, Q-P9):
 * - most hours are **lone courses** of the whole division, cut by `piecesOf`;
 * - the LV2 of the cycle 4 and the soutien of the 6e go in **barrettes over a pair of divisions** of the level (the
 *   last one alone when their count is odd): two groups at the same slot, each made of one half of each division.
 *   The LV2 makes a Spanish group and a German one; the soutien a français group, taught by the first division's
 *   français teacher, and a maths group, by the second's maths teacher;
 * - the odd half-hour of SVT and of physique-chimie becomes **half-groups**, on weeks A and B for real: on week A the
 *   first half does SVT while the second does physique-chimie, swapped on week B. Four courses in one barrette; the
 *   two teachers give 2 h a week for the 1,5 h of the grid.
 *
 * A course here has a `need` instead of a teacher: the key of the teaching it belongs to, `subject:division`, which
 * the staffing fills (staff.js).
 */
const PAIRED = new Set(["lv2", "sout"]);
const HALVED = Object.freeze(["svt", "pc"]);
const FIRST = 1;
const SECOND = 2;
const WHOLE = 3;

/** The divisions of each level two by two, in order, keyed by the first of each pair. */
function pairsOf(divisions) {
  const pairs = new Map();
  for (const level of new Set(divisions.map((division) => division.level))) {
    const same = divisions.filter((division) => division.level === level);
    for (let i = 0; i < same.length; i += 2) pairs.set(same[i].id, same.slice(i, i + 2));
  }
  return pairs;
}

const draft = ({ divisions, halves, discipline, need, home }, piece) => ({
  divisions,
  halves,
  discipline,
  need,
  ...piece,
  kind: DISCIPLINES[discipline].kind,
  home,
});

function lone(division, discipline, piece) {
  const home = DISCIPLINES[discipline].kind === "ordinary" ? division.homeRoom : -1;
  return draft({ divisions: [division.id], halves: WHOLE, discipline, need: `${discipline}:${division.id}`, home }, piece);
}

/** The two groups of a pair's barrette for one piece: the LV2's two languages, or the soutien's français and maths. */
function groupsOf(pair, discipline, piece) {
  const divisions = pair.map((division) => division.id);
  const homes = [pair[0].homeRoom, pair[1]?.homeRoom ?? -1];
  if (discipline === "lv2") {
    return LANGUAGES.map((language, g) =>
      draft({ divisions, halves: g ? SECOND : FIRST, discipline, need: `${language}:${pair[0].id}`, home: homes[g] }, piece),
    );
  }
  const owners = [pair[0], pair.at(-1)];
  return ["fr", "ma"].map((subject, g) =>
    draft({ divisions, halves: g ? SECOND : FIRST, discipline, need: `${subject}:${owners[g].id}`, home: homes[g] }, piece),
  );
}

/** The half-groups of SVT and physique-chimie, A and B swapped, in one barrette. */
function halvedOf(division) {
  const one = (discipline, halves, weeks) =>
    draft({ divisions: [division.id], halves, discipline, need: `${discipline}:${division.id}`, home: -1 }, { length: 1, weeks });
  return [one("svt", FIRST, "A"), one("svt", SECOND, "B"), one("pc", SECOND, "A"), one("pc", FIRST, "B")];
}

/** The barrettes of one division in one discipline, given to `link`. */
function disciplineLinks({ division, pairs, link }, discipline, pieces) {
  if (PAIRED.has(discipline)) {
    const pair = pairs.get(division.id);
    if (pair) for (const piece of pieces) link(groupsOf(pair, discipline, piece));
    return;
  }
  const halved = HALVED.includes(discipline);
  for (const piece of pieces) if (!halved || piece.weeks === "AB") link([lone(division, discipline, piece)]);
  if (discipline === HALVED[0]) link(halvedOf(division));
}

/**
 * Every course and barrette of the collège, division after division in the order of the grid; a single-week hour
 * alternates A and B.
 * @param {import("../types.js").Division[]} divisions
 */
export function coursesOf(divisions) {
  const courses = [];
  const links = [];
  const link = (drafts) => {
    links.push(drafts.map((course) => courses.push({ id: courses.length, ...course, link: links.length }) - 1));
  };
  const pairs = pairsOf(divisions);
  divisions.forEach((division, d) => {
    Object.entries(GRID[division.level]).forEach(([discipline, halfHours], k) => {
      disciplineLinks({ division, pairs, link }, discipline, piecesOf(discipline, halfHours, (d + k) % 2));
    });
  });
  return { courses, links };
}
