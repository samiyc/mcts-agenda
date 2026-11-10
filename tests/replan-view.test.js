import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { orphan } from "../src/absence/plan.js";
import { p0, p1 } from "../src/absence/rules.js";
import { runWeek } from "../src/absence/run.js";
import { drawWeek } from "../src/absence/scenario.js";
import { replanSearch } from "../src/absence/search.js";
import { buildGreedy } from "../src/build/greedy.js";
import { createSchool } from "../src/school/generate.js";
import { absenceRows, busiestDivision, changeRows, dayOfMoment, momentName, planAt, playWeek, sideOf } from "../src/view/replan.js";
import { weekOf } from "../src/view/week.js";

const school = createSchool({ size: "S", seed: 3 });
const { timetable } = buildGreedy(school, { seed: 3 });
const scenario = [1, 2, 3, 4, 5, 6].map((seed) => drawWeek(school, seed)).find((week) => week.absences.length >= 2);
const courseIds = (cells) => cells.map((entries) => entries.map((e) => e.course).sort((a, b) => a - b));

describe("the replacement page's model", () => {
  it("names the moments: the timetable in place, then the evening before and the morning of each day", () => {
    assert.equal(momentName(0), "l'emploi du temps en place");
    assert.equal(momentName(1), "la veille du lundi, 18 h");
    assert.equal(momentName(4), "mardi matin, 7 h 30");
    assert.deepEqual([0, 1, 2, 3, 10].map(dayOfMoment), [-1, 0, 0, 1, 4]);
  });

  it("keeps eleven moments, the last scored as the week", () => {
    const rule = replanSearch({ tries: 2000, seed: 4 });
    const { moments, score } = playWeek(school, timetable, scenario, rule);
    assert.equal(moments.length, 11);
    assert.deepEqual(moments.at(-1).score, score);
    assert.deepEqual(score, runWeek(school, timetable, scenario, replanSearch({ tries: 2000, seed: 4 })).score);
    assert.equal(moments[0].score.lost, 0);
  });

  it("shows before the week of the timetable in place, and after the plan at that moment", () => {
    const { moments } = playWeek(school, timetable, scenario, replanSearch({ tries: 2000, seed: 4 }));
    const plan = planAt(school, timetable, scenario.week, moments.at(-1));
    const view = { kind: "division", id: busiestDivision(school, plan) };
    assert.deepEqual(courseIds(sideOf(school, plan, view, "before")), courseIds(weekOf(school, timetable, view)[scenario.week]));
    const after = sideOf(school, plan, view, "after").flat();
    const before = sideOf(school, plan, view, "before").flat();
    assert.equal(after.length, before.length, "a session moves, it does not vanish");
    assert.equal(after.filter((e) => e.status).length, before.filter((e) => e.status === "was").length);
    assert.ok(after.some((e) => e.status), "the busiest division has a change");
  });

  it("lists every lost or changed session once, in the order of the timetable in place", () => {
    const { moments } = playWeek(school, timetable, scenario, p0);
    const plan = planAt(school, timetable, scenario.week, moments.at(-1));
    const rows = changeRows(school, plan);
    const lost = Array.from(plan.course.keys()).filter((s) => orphan(plan, s)).length;
    assert.equal(rows.length, lost);
    assert.ok(rows.every((row) => row.status === "lost" && row.became.startsWith("étude")));
    assert.deepEqual(rows.map((r) => r.slot), rows.map((r) => r.slot).sort((a, b) => a - b));
    const replaced = changeRows(school, planAt(school, timetable, scenario.week, playWeek(school, timetable, scenario, p1).moments.at(-1)));
    assert.ok(replaced.every((row) => row.became.length > 0));
  });

  it("tells which absences are known at a moment", () => {
    const at = (k) => absenceRows(school, scenario, k).filter((row) => row.revealed).length;
    assert.equal(at(0), 0);
    assert.equal(at(10), scenario.absences.length);
    for (let k = 1; k <= 10; k += 1) assert.ok(at(k) >= at(k - 1));
    assert.match(absenceRows(school, scenario, 0)[0].known, /^connue (la veille du|\w+ matin)/);
  });
});
