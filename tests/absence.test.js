import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildGreedy } from "../src/build/greedy.js";
import { placeFor } from "../src/absence/moves.js";
import { changesOf, mark, orphan, planOf, replace, setSession } from "../src/absence/plan.js";
import { canReplace, orphansOf, p0, p1 } from "../src/absence/rules.js";
import { runWeek } from "../src/absence/run.js";
import { drawWeek, volunteersOf } from "../src/absence/scenario.js";
import { replanSearch } from "../src/absence/search.js";
import { areaCost, softOf } from "../src/absence/soft.js";
import { evaluate } from "../src/evaluate.js";
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

/** Whether `room` is free over session `s`'s slots in the timetable in place: the move a put-back could keep. */
function freeAt(plan, s, room) {
  const { length } = school.courses[plan.course[s]];
  for (let k = 0; k < length; k += 1) if (plan.busy.room[room * SLOTS + plan.origin.slot[s] + k] > 0) return false;
  return true;
}

const clashFree = (plan) => [plan.busy.division, plan.busy.teacher, plan.busy.room].every((layer) => layer.every((n) => n <= 1));

describe("the absences", () => {
  it("are drawn from their seed: 9 % of the days, 1 to 3 days, known the evening before or the morning", () => {
    assert.deepEqual(drawWeek(school, 5), drawWeek(school, 5));
    const all = weeks.flatMap((w) => w.absences);
    assert.ok(all.every((a) => a.from <= a.to && a.to - a.from < 3 && a.to < DAYS.length));
    const days = all.reduce((sum, a) => sum + a.to - a.from + 1, 0) / weeks.length;
    const share = days / (5 * school.teachers.length);
    assert.ok(share > 0.05 && share < 0.14, `${days} days a week for ${school.teachers.length} teachers`);
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

  it("puts a session back in its own room, not the one it was moved to", () => {
    const plan = planOf(school, timetable, 0);
    const s = Array.from(plan.course.keys()).find((i) => {
      for (let slot = 0; slot < SLOTS; slot += 1) {
        const room = placeFor(plan, i, slot, 0);
        if (room >= 0 && room !== plan.room[i] && slot !== plan.slot[i] && freeAt(plan, i, room)) return setSession(plan, i, { teacher: plan.teacher[i], slot, room }, 1) ?? true;
      }
      return false;
    });
    assert.ok(s !== undefined, "a session moved to another room");
    assert.equal(placeFor(plan, s, plan.origin.slot[s], 0), plan.origin.room[s]);
  });

  it("finds no room for a session on a day before the decision, or across another session", () => {
    const plan = planOf(school, timetable, 0);
    const late = Array.from(plan.course.keys()).find((s) => dayOf(plan.slot[s]) > 0);
    assert.equal(placeFor(plan, late, 0, 1), -1);
    const other = Array.from(plan.course.keys()).find((s) => s !== late && plan.parts[plan.course[s]].some((p) => plan.parts[plan.course[late]].includes(p)));
    assert.equal(placeFor(plan, late, plan.slot[other], 0), -1);
  });
});

describe("the soft cost of a week", () => {
  it("adds up, weeks A and B with no absence, to the evaluator's cost", () => {
    assert.equal(softOf(planOf(school, timetable, 0)) + softOf(planOf(school, timetable, 1)), evaluate(school, timetable).cost);
  });

  it("prices a move on the area it touches, as the whole week does", () => {
    const plan = planOf(school, timetable, weeks[2].week);
    for (const a of weeks[2].absences) for (let d = a.from; d <= a.to; d += 1) plan.absent[a.teacher * DAYS.length + d] = 1;
    let moves = 0;
    for (let i = 0; i < 400; i += 1) {
      const s = (i * 37) % plan.course.length;
      const slot = (i * 13) % SLOTS;
      const room = placeFor(plan, s, slot, 0);
      if (room < 0) continue;
      const teacher = i % 3 === 0 ? (i * 7) % school.teachers.length : plan.teacher[s];
      const area = { day0: dayOf(plan.slot[s]), day1: dayOf(slot), teacher0: plan.teacher[s], teacher1: teacher };
      const [whole, part] = [softOf(plan), areaCost(plan, s, area)];
      setSession(plan, s, { teacher, slot, room }, 1);
      assert.equal(softOf(plan) - whole, areaCost(plan, s, area) - part, `move ${i}`);
      moves += 1;
    }
    assert.ok(moves > 20);
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
