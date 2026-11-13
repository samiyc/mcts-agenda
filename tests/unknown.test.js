import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { oddsOf } from "../src/absence/belief.js";
import { planOf } from "../src/absence/plan.js";
import { p0, p1 } from "../src/absence/rules.js";
import { runWeek } from "../src/absence/run.js";
import { drawWeek } from "../src/absence/scenario.js";
import { replanSearch } from "../src/absence/search.js";
import { buildGreedy } from "../src/build/greedy.js";
import { createSchool } from "../src/school/generate.js";
import { DAYS } from "../src/time.js";

/** J6: the absences whose length is learned day after day (docs/modele.md § 4). */
const school = createSchool({ size: "S", seed: 1 });
const { timetable } = buildGreedy(school, { seed: 1 });
const hidden = (seed) => ({ ...drawWeek(school, seed), hidden: /** @type {const} */ ("veille") });
const weeks = Array.from({ length: 40 }, (_, i) => hidden(i + 1));
const DAY = DAYS.length;

/** A week with an absence learned day after day that lasts two days or more and ends before Friday. */
const long = weeks.find((w) => w.absences.some((a) => a.told === "daily" && a.to > a.from && a.to < DAY - 1));
const longAbsence = long.absences.find((a) => a.told === "daily" && a.to > a.from && a.to < DAY - 1);

describe("the absences of unknown length", () => {
  it("are J5's absences, half of the morning ones learned day after day", () => {
    const all = weeks.flatMap((w) => w.absences);
    assert.ok(all.every((a) => a.told === "whole" || a.known === "matin"));
    const morning = all.filter((a) => a.known === "matin");
    const daily = morning.filter((a) => a.told === "daily").length / morning.length;
    assert.ok(daily > 0.25 && daily < 0.75, `${daily}`);
  });

  it("are revealed day by day, the end the evening after, and in full by the end of the week", () => {
    const { teacher, from, to } = longAbsence;
    const seen = [];
    const watch = (plan, ctx) => seen.push({ ...ctx, away: Array.from(plan.absent.subarray(teacher * DAY, teacher * DAY + DAY)), from: plan.ongoing.from[teacher], days: plan.ongoing.days[teacher] });
    const { plan } = runWeek(school, timetable, long, watch);
    const at = (day, moment) => seen.find((m) => m.day === day && m.moment === moment);
    assert.deepEqual(at(from, "matin").away.slice(from), [1, ...new Array(DAY - from - 1).fill(0)]);
    assert.equal(at(from, "matin").days, 1);
    assert.equal(at(from + 1, "veille").away[from + 1], 1);
    assert.equal(at(from + 1, "veille").days, 2);
    assert.equal(at(to, "matin").from, from);
    assert.equal(at(to + 1, "veille").from, -1, "the evening after its last day, it is over");
    const told = runWeek(school, timetable, { ...long, hidden: false }, p0).plan;
    assert.deepEqual(plan.absent, told.absent);
  });
});

describe("the beliefs of the search", () => {
  const plan = planOf(school, timetable, 0);
  const t = 3;
  plan.absent[t * DAY + 1] = 1;
  plan.ongoing.from[t] = 1;
  plan.ongoing.days[t] = 1;
  const row = (belief) => Array.from(oddsOf(plan, belief).subarray(t * DAY, t * DAY + DAY), (x) => Math.round(x * 1000) / 1000);

  it("count a day known away as sure, and the days before as free", () => {
    for (const belief of ["known", "worst", "odds"]) assert.deepEqual(row(belief).slice(0, 2), [0, 1]);
  });

  it("differ on the days after: back tomorrow, away to the third day, or the scenario's odds", () => {
    assert.deepEqual(row("known").slice(2), [0, 0, 0]);
    assert.deepEqual(row("worst").slice(2), [1, 1, 0]);
    assert.deepEqual(row("odds").slice(2), [0.667, 0.333, 0]);
    plan.absent[t * DAY + 2] = 1;
    plan.ongoing.days[t] = 2;
    assert.deepEqual(row("odds").slice(2), [1, 0.5, 0]);
  });
});

describe("the notices", () => {
  it("are none for P0, P1's changes for P1, and at least the changes for the search", () => {
    for (const scenario of weeks.slice(0, 10)) {
      assert.equal(runWeek(school, timetable, scenario, p0).score.notices, 0);
      const byP1 = runWeek(school, timetable, scenario, p1).score;
      assert.equal(byP1.notices, byP1.changes);
      const bySearch = runWeek(school, timetable, scenario, replanSearch({ tries: 2000, seed: 5 })).score;
      assert.ok(bySearch.notices >= bySearch.changes - 1e-9);
    }
  });
});

describe("the search under each belief", () => {
  it("loses no more than P1 week by week, and replays from its seed", () => {
    for (const belief of /** @type {const} */ (["known", "worst", "odds"])) {
      for (const scenario of weeks.slice(0, 8)) {
        const p1Lost = runWeek(school, timetable, scenario, p1).score.lost;
        const { score } = runWeek(school, timetable, scenario, replanSearch({ tries: 2000, seed: 9, belief }));
        assert.ok(score.lost <= p1Lost + 1e-9, `${belief}, week ${scenario.seed}: ${score.lost} against ${p1Lost}`);
      }
      const again = () => runWeek(school, timetable, long, replanSearch({ tries: 2000, seed: 9, belief })).score;
      assert.deepEqual(again(), again());
    }
  });
});
