import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { buildGreedy, buildNaive } from "../src/build/greedy.js";
import { evaluate } from "../src/evaluate.js";
import { createSchool } from "../src/school/generate.js";

/**
 * What the model does, held in a hash (as in the other clients of mcts-commun): a refactor must leave it unchanged.
 * A change meant to alter the model updates it here (`node scripts/refresh-fingerprints.js`), and its commit says so,
 * with the measures before and after.
 */
const EXPECTED = {
  // 6/11/2026, J1: the collège of docs/modele.md § 2, EPS in 2 h blocks.
  schools: "3d76f370d3888173",
  // 6/11/2026, J1: R0 and R0-naïf, the evaluation D1 to D8 and S1 to S8.
  builds: "045f0af55c985146",
};

const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
const bytes = (array) => createHash("sha256").update(new Uint8Array(array.buffer)).digest("hex");

/** Three collèges, every field of every division, teacher, room and course. */
function schools() {
  return ["S", "M", "L"].map((size, seed) => {
    const school = createSchool({ size, seed: seed + 1 });
    return [school.divisions, school.teachers.map((t) => ({ ...t, unavailable: bytes(t.unavailable) })), school.rooms, school.courses];
  });
}

/** R0 on a small collège, R0-naïf on a middle one: every placement and every count. */
function builds() {
  const small = createSchool({ size: "S", seed: 4 });
  const middle = createSchool({ size: "M", seed: 5 });
  const greedy = buildGreedy(small, { seed: 4 });
  const naive = buildNaive(middle);
  return [
    [bytes(greedy.timetable.slot), bytes(greedy.timetable.room), greedy.unplaced, evaluate(small, greedy.timetable)],
    [bytes(naive.timetable.slot), bytes(naive.timetable.room), naive.unplaced, evaluate(middle, naive.timetable)],
  ];
}

describe("the fingerprints", () => {
  it("of the collèges", () => {
    assert.equal(digest(schools()), EXPECTED.schools);
  });

  it("of R0 and R0-naïf", () => {
    assert.equal(digest(builds()), EXPECTED.builds);
  });
});
