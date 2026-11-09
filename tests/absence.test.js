import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildGreedy } from "../src/build/greedy.js";
import { placeFor } from "../src/absence/moves.js";
import { changesOf, mark, orphan, planOf, replace } from "../src/absence/plan.js";
import { canReplace, orphansOf, p0, p1 } from "../src/absence/rules.js";
import { runWeek } from "../src/absence/run.js";
import { drawWeek, volunteersOf } from "../src/absence/scenario.js";
import { replanSearch } from "../src/absence/search.js";
import { createSchool } from "../src/school/generate.js";
import { DAYS, SLOTS, dayOf } from "../src/time.js";

const school = createSchool({ size: "S", seed: 1 });
const { timetable } = buildGreedy(school, { seed: 1 });
const weeks = Array.from({ length: 12 }, (_, i) => drawWeek(school, i + 1));

/** The busy layers rebuilt from the sessions, to compare with the ones kept move by move. */
function rebuilt(plan) {
  const copy = { ...plan, busy: { division: plan.busy.division.slice().fill(0), teacher: plan.busy.teacher.slice().fill(0), room: plan.busy.room.slice().fill(0) } };
  for (let s = 0; s < plan.course.length; s += 1) mark(copy, s, 1);
  return copy.busy;
}

const clashFree = (plan) => [plan.busy.division, plan.busy.teacher, plan.busy.room].every((layer) => layer.every((n) => n <= 1));

describe("the absences", () => {
  it("are drawn from their seed: a day a month, 1 to 3 days, known the evening before or the morning", () => {
    assert.deepEqual(drawWeek(school, 5), drawWeek(school, 5));
    const all = weeks.flatMap((w) => w.absences);
    assert.ok(all.every((a) => a.from <= a.to && a.to - a.from < 3 && a.to < DAYS.length));
    const days = all.reduce((sum, a) => sum + a.to - a.from + 1, 0) / weeks.length;
    assert.ok(days > 1 && days < 8, `${days} days a week for ${school.teachers.length} teachers`);
    assert.ok(all.some((a) => a.known === "veille") && all.some((a) => a.known === "matin"));
  });

  it("give hours to volunteers only, two at most", () => {
    const volunteers = volunteersOf(school);
    for (const { budget } of weeks) budget.forEach((hours, t) => assert.ok(hours === 0 || (volunteers[t] === 1 && hours === 2)));
  });
});

describe("P0 and P1", () => {
  it("P0 loses every session whose teacher is away, and changes nothing", () => {
    for (const scenario of weeks) {
      const { plan, score } = runWeek(school, timetable, scenario, p0);
      assert.equal(score.changes, 0);
      const away = scenario.absences.flatMap((a) => Array.from({ length: a.to - a.from + 1 }, (_, k) => [a.teacher, a.from + k]));
      const lostSessions = Array.from(plan.course.keys()).filter((s) => away.some(([t, d]) => plan.teacher[s] === t && dayOf(plan.slot[s]) === d));
      assert.equal(lostSessions.every((s) => orphan(plan, s)), true);
    }
  });

  it("P1 loses no more than P0, replaces within the budgets, and leaves no clash", () => {
    for (const scenario of weeks) {
      const before = runWeek(school, timetable, scenario, p0).score;
      const { plan, score } = runWeek(school, timetable, scenario, p1);
      assert.ok(score.lost <= before.lost);
      plan.replacements.forEach((hours, t) => assert.ok(hours <= scenario.budget[t]));
      assert.ok(clashFree(plan));
    }
  });

  it("lets no one replace in the morning who is not at the collège that day", () => {
    const plan = planOf(school, timetable, 0);
    const s = 0;
    const day = dayOf(plan.slot[s]);
    const budget = new Uint8Array(school.teachers.length).fill(2);
    const away = school.teachers.findIndex((t, id) => id !== plan.teacher[s] && !plan.busy.teacher.slice(id * SLOTS + DAYS[day].first, id * SLOTS + DAYS[day].first + DAYS[day].count).some(Boolean));
    if (away >= 0) assert.equal(canReplace(plan, s, away, { moment: "matin", budget }), false);
  });
});

describe("the plan", () => {
  it("counts a change by when it was decided, and nothing once undone", () => {
    const plan = planOf(school, timetable, 0);
    const [first, second] = [plan.teacher[0], (plan.teacher[0] + 1) % school.teachers.length];
    replace(plan, 0, second, 0.5);
    assert.deepEqual([changesOf(plan), plan.replacements[second]], [0.5, school.courses[plan.course[0]].length]);
    replace(plan, 0, first, 1);
    assert.deepEqual([changesOf(plan), plan.replacements[second]], [0, 0]);
  });

  it("finds no room for a session on a day before the decision, or across another session", () => {
    const plan = planOf(school, timetable, 0);
    const late = Array.from(plan.course.keys()).find((s) => dayOf(plan.slot[s]) > 0);
    assert.equal(placeFor(plan, late, 0, 1), -1);
    const other = Array.from(plan.course.keys()).find((s) => s !== late && plan.parts[plan.course[s]].some((p) => plan.parts[plan.course[late]].includes(p)));
    assert.equal(placeFor(plan, late, plan.slot[other], 0), -1);
  });
});

describe("the replanning search", () => {
  const rule = () => replanSearch({ tries: 3000, seed: 7 });

  it("loses no more than P1 week by week, keeps the busy layers right, and leaves no clash", () => {
    let saved = 0;
    for (const scenario of weeks) {
      const p1Lost = runWeek(school, timetable, scenario, p1).score.lost;
      const { plan, score } = runWeek(school, timetable, scenario, rule());
      assert.ok(score.lost <= p1Lost, `week ${scenario.seed}: ${score.lost} against ${p1Lost}`);
      assert.deepEqual(rebuilt(plan), plan.busy);
      assert.ok(clashFree(plan));
      plan.replacements.forEach((hours, t) => assert.ok(hours <= scenario.budget[t]));
      saved += p1Lost - score.lost;
    }
    assert.ok(saved > 0);
  });

  it("replays from its seed", () => {
    const [a, b] = [runWeek(school, timetable, weeks[3], rule()), runWeek(school, timetable, weeks[3], rule())];
    assert.deepEqual(a.score, b.score);
    assert.deepEqual(Array.from(a.plan.slot), Array.from(b.plan.slot));
  });

  it("touches nothing of the days already past", () => {
    const search = rule();
    /** The search, checked at each moment: the sessions of the days before stay as they were. */
    const watched = (plan, ctx) => {
      const past = (s) => dayOf(plan.slot[s]) < ctx.day;
      const before = Array.from(plan.course.keys(), (s) => (past(s) ? [plan.slot[s], plan.teacher[s], plan.room[s]] : null));
      search(plan, ctx);
      before.forEach((was, s) => was && assert.deepEqual([plan.slot[s], plan.teacher[s], plan.room[s]], was));
    };
    for (const scenario of weeks.slice(0, 6)) runWeek(school, timetable, scenario, watched);
    assert.equal(orphansOf(planOf(school, timetable, 0), 0).length, 0);
  });
});
