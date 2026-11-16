import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createBoard, place, timetableOf } from "../src/board.js";
import { dayRoomLeft, planOf } from "../src/absence/plan.js";
import { canReplace } from "../src/absence/rules.js";
import { evaluate } from "../src/evaluate.js";
import { reasonOf, tryCourse } from "../src/rules/hard.js";
import { createSchool } from "../src/school/generate.js";

/**
 * D10 (docs/modele.md § 3.1): an EPS teacher teaches six hours a day at most. The rule refuses the seventh hour, the
 * evaluator counts the hours beyond six, the replanning neither replaces with nor moves a session to such a day.
 */
const school = createSchool({ size: "S", seed: 3 });
const gym = school.rooms.filter((r) => r.kind === "gym");
const blocksOf = (teacher) => school.courses.filter((c) => c.teacher === teacher.id && c.discipline === "eps" && c.weeks === "AB");
/** An EPS teacher free on Monday with four blocks of four divisions. */
const teacher = school.teachers.find((t) => {
  const divisions = new Set(blocksOf(t).map((c) => c.divisions[0]));
  return t.discipline === "eps" && divisions.size >= 4 && t.unavailable.subarray(0, 9).every((x) => x === 0);
});
const blocks = [...new Map(blocksOf(teacher).map((c) => [c.divisions[0], c])).values()].slice(0, 4);

/** Three 2 h blocks on Monday, 8 h, 10 h and 13 h: six hours. */
function sixHours() {
  const board = createBoard(school);
  [0, 2, 5].forEach((slot, i) => place(board, blocks[i].id, slot, gym[i % gym.length].id));
  return board;
}

describe("an EPS teacher's day (D10)", () => {
  it("takes no seventh hour, and another teacher's day is not capped", () => {
    const board = sixHours();
    assert.equal(reasonOf(tryCourse(board, blocks[3].id, 7)), "teacher-day");
    assert.equal(reasonOf(tryCourse(board, blocks[3].id, 9)) === "teacher-day", false, "Tuesday is free");
    const plan = planOf(school, timetableOf(board), 0);
    const other = school.teachers.find((t) => t.discipline === "fr");
    assert.equal(dayRoomLeft(plan, other.id, 7, 2), true, "only an EPS teacher's day is capped");
  });

  it("counts the hours beyond six, each week", () => {
    const board = sixHours();
    assert.equal(evaluate(school, timetableOf(board)).hard.D10, 0);
    place(board, blocks[3].id, 7, gym[3 % gym.length].id);
    assert.equal(evaluate(school, timetableOf(board)).hard.D10, 4, "two hours too many, on weeks A and B");
  });

  it("is never given a replacement nor a session past six hours", () => {
    const plan = planOf(school, timetableOf(sixHours()), 0);
    assert.equal(dayRoomLeft(plan, teacher.id, 7, 1), false);
    assert.equal(dayRoomLeft(plan, teacher.id, 9, 2), true);
    const french = plan.course.findIndex((id) => school.courses[id].discipline === "fr");
    const s = Math.max(0, french);
    const ctx = { budget: new Uint8Array(school.teachers.length).fill(5), moment: "veille" };
    plan.slot[s] = 7;
    assert.equal(canReplace(plan, s, teacher.id, ctx), false);
  });
});
