import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildGreedy } from "../src/build/greedy.js";
import { evaluate } from "../src/evaluate.js";
import { createSchool } from "../src/school/generate.js";
import { costRows, unplacedRows } from "../src/view/costs.js";
import { choicesOf, namesOf, pupilsOf, titleOf, weekOf } from "../src/view/week.js";
import { SLOTS, weeksOf } from "../src/time.js";

const school = createSchool({ size: "S", seed: 2 });
const { timetable } = buildGreedy(school, { seed: 2 });
const cellsOf = (week) => week.reduce((sum, entries) => sum + entries.length, 0);

describe("the page's model", () => {
  it("names teachers by subject and number, and lists the choices of each view", () => {
    const { teacher } = namesOf(school);
    assert.equal(teacher[0], "français 1");
    assert.ok(teacher.some((name) => name.startsWith("espagnol")));
    assert.deepEqual(choicesOf(school, "division")[0], { id: 0, name: "6e A" });
    assert.equal(choicesOf(school, "room").length, school.rooms.length);
  });

  it("titles the LV2 by its language and the soutien by its subject, and names a group across a pair", () => {
    const lv2 = school.courses.find((c) => c.discipline === "lv2" && c.divisions.length === 2);
    assert.match(titleOf(school, lv2), /^LV2 (espagnol|allemand)$/);
    assert.equal(pupilsOf(school, lv2), `5e A et 5e B, groupe ${lv2.halves}`);
    const sout = school.courses.find((c) => c.discipline === "sout");
    assert.match(titleOf(school, sout), /^soutien (français|mathématiques)$/);
  });

  it("gives a division its 26 hours on each week, two entries where its halves are apart", () => {
    const week = weekOf(school, timetable, { kind: "division", id: 4 });
    for (const w of [0, 1]) {
      const hours = week[w].filter((entries) => entries.length > 0).length;
      assert.ok(hours >= 24 && hours <= 28, `week ${w}: ${hours} hours`);
      assert.ok(week[w].some((entries) => entries.length === 2 && entries.every((e) => e.group)), "a half-group or an LV2 slot");
    }
    assert.equal(week[0].length, SLOTS);
  });

  it("shows a teacher's courses, each hour of a block, as many as the teacher's load", () => {
    const eps = school.teachers.find((t) => t.discipline === "eps");
    const week = weekOf(school, timetable, { kind: "teacher", id: eps.id });
    assert.equal(cellsOf(week[0]) + cellsOf(week[1]), eps.load * 2);
    const block = week[0].findIndex((entries) => entries.length > 0);
    assert.deepEqual([week[0][block][0].first, week[0][block + 1][0].first], [true, false]);
  });

  it("shows a room's courses, with the pupils and the teacher", () => {
    const gym = school.rooms.find((r) => r.kind === "gym");
    const week = weekOf(school, timetable, { kind: "room", id: gym.id });
    const used = school.courses.filter((c) => timetable.room[c.id] === gym.id);
    assert.equal(cellsOf(week[0]) + cellsOf(week[1]), used.reduce((sum, c) => sum + c.length * weeksOf(c.weeks).length, 0));
    const [entry] = week[0].find((entries) => entries.length > 0);
    assert.match(entry.detail, /^\de [A-C].* · EPS \d$/);
  });

  it("lists the costs with their weights, and why a barrette was left", () => {
    const rows = costRows(evaluate(school, timetable));
    assert.equal(rows.hard.length, 8);
    assert.ok(rows.soft.every((row) => row.cost === row.weight * row.count && row.label));
    const course = school.courses[0];
    const [row] = unplacedRows(school, [{ link: 0, courses: [0], reasons: { teacher: 30, division: 10 } }]);
    assert.equal(row.title, titleOf(school, course));
    assert.equal(row.why, "le professeur a déjà cours (30 créneaux), les élèves ont déjà cours (10 créneaux)");
  });
});
