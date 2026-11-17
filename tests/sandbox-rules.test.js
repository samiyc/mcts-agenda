import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { placeFor } from "../src/absence/moves.js";
import { planOf } from "../src/absence/plan.js";
import { runWeek } from "../src/absence/run.js";
import { replanSearch } from "../src/absence/search.js";
import { buildGreedy } from "../src/build/greedy.js";
import { evaluate } from "../src/evaluate.js";
import { reasonOf, tryCourse } from "../src/rules/hard.js";
import { applyEdits, emptyEdits, readEdits, scenarioOf } from "../src/sandbox/edits.js";
import { createSchool } from "../src/school/generate.js";
import { anneal } from "../src/search/anneal.js";
import { createBoard } from "../src/board.js";
import { DAYS, dayOf, weeksOf } from "../src/time.js";

/**
 * The sandbox's constraints beyond J8 (docs/modele.md § 14): a teacher's hours a day (D10), the slots a division is
 * kept from (D11), the room imposed on a course (D3). The rule, the searches and the replanning keep them; the
 * evaluator counts them when broken.
 */
const school = createSchool({ size: "S", seed: 2 });
const { timetable } = buildGreedy(school, { seed: 2 });
const edits = (change) => ({ ...emptyEdits("S", 2), ...change });
/** A French teacher, his most hours in a day of the drawn timetable. */
const teacher = school.teachers.find((t) => t.discipline === "fr");
const MONDAY_MORNING = [0, 1, 2, 3];
/** A course of an ordinary room, and another ordinary room than the one R0 gives it. */
const course = school.courses.find((c) => c.kind === "ordinary" && c.home >= 0 && school.links[c.link].length === 1);
const other = school.rooms.find((r) => r.kind === "ordinary" && r.id !== timetable.room[course.id]).id;

/** The most hours `t` teaches in a day of `found`, on either week. */
function mostHours(found, t) {
  const hours = new Map();
  for (const c of school.courses) {
    const slot = found.slot[c.id];
    if (c.teacher !== t || slot < 0) continue;
    for (const week of weeksOf(c.weeks)) hours.set(`${week}-${dayOf(slot)}`, (hours.get(`${week}-${dayOf(slot)}`) ?? 0) + c.length);
  }
  return Math.max(...hours.values());
}

/** Whether a course of division 0 sits on one of `slots` in `found`. */
const onSlots = (found, slots) => school.courses.some((c) => c.divisions.includes(0) && found.slot[c.id] >= 0 && Array.from({ length: c.length }, (_, k) => found.slot[c.id] + k).some((s) => slots.includes(s)));

describe("the sandbox's further constraints", () => {
  it("come back from JSON, and refuse what does not fit", () => {
    const set = edits({ teachers: { [teacher.id]: { away: [], avoid: [], dayMax: 3 } }, divisions: { 0: { away: MONDAY_MORNING } }, rooms: { [course.id]: other } });
    assert.deepEqual(readEdits(JSON.parse(JSON.stringify(set)), school), set);
    const bad = (change) => assert.throws(() => readEdits(edits(change), school), Error);
    bad({ teachers: { [teacher.id]: { away: [], avoid: [], dayMax: 0 } } });
    bad({ teachers: { [teacher.id]: { away: [], avoid: [], dayMax: 9 } } });
    bad({ divisions: { 99: { away: [] } } });
    bad({ rooms: { [course.id]: school.rooms.find((r) => r.kind === "gym").id } });
    bad({ rooms: { [course.id]: other }, locks: { [course.id]: { slot: timetable.slot[course.id], room: timetable.room[course.id] } } });
    const old = { ...emptyEdits("S", 2) };
    delete old.divisions;
    delete old.rooms;
    assert.deepEqual(readEdits(old, school), emptyEdits("S", 2), "a file of J8 still reads");
  });

  it("cap a teacher's day, in the rule, the search and the evaluator", () => {
    assert.ok(mostHours(timetable, teacher.id) > 3, "the cap bites");
    const capped = applyEdits(school, edits({ teachers: { [teacher.id]: { away: [], avoid: [], dayMax: 3 } } }));
    const built = buildGreedy(capped, { seed: 2 });
    assert.ok(mostHours(built.timetable, teacher.id) <= 3);
    assert.ok(mostHours(anneal(capped, built.timetable, { seed: 2, tries: 20000 }).timetable, teacher.id) <= 3);
    assert.ok(evaluate(capped, timetable).hard.D10 > 0, "the drawn timetable breaks it");
    assert.equal(evaluate(school, timetable).hard.D10, 0, "and not without the setting");
  });

  it("keep a division from lessons on its slots, and say why", () => {
    assert.ok(onSlots(timetable, MONDAY_MORNING));
    const kept = applyEdits(school, edits({ divisions: { 0: { away: MONDAY_MORNING } } }));
    const built = buildGreedy(kept, { seed: 2 });
    assert.equal(onSlots(built.timetable, MONDAY_MORNING), false);
    assert.equal(evaluate(kept, built.timetable).hard.D11, 0);
    assert.ok(evaluate(kept, timetable).hard.D11 > 0);
    const id = school.courses.find((c) => c.divisions.includes(0) && c.length === 1).id;
    assert.equal(reasonOf(tryCourse(createBoard(kept), id, 1)), "division-away");
    const plan = planOf(kept, built.timetable, 0);
    const s = plan.course.findIndex((c) => school.courses[c].divisions.includes(0) && school.courses[c].length === 1);
    assert.equal(placeFor(plan, s, 1, 0), -1, "the replanning moves no session there");
  });

  it("put a course in the room imposed, or count it in D3", () => {
    const imposed = applyEdits(school, edits({ rooms: { [course.id]: other } }));
    const built = buildGreedy(imposed, { seed: 2 });
    assert.ok([other, -1].includes(built.timetable.room[course.id]));
    assert.equal(evaluate(imposed, built.timetable).hard.D3, 0);
    assert.ok(evaluate(imposed, timetable).hard.D3 > 0, "R0's room for it is now wrong");
    const day = dayOf(built.timetable.slot[course.id]);
    const week = { ...edits({ rooms: { [course.id]: other } }), absences: [{ teacher: course.teacher, from: day, to: Math.min(day + 1, DAYS.length - 1), known: "veille", told: "whole" }] };
    const { plan } = runWeek(imposed, built.timetable, scenarioOf(imposed, week), replanSearch({ tries: 4000, seed: 3 }));
    for (let s = 0; s < plan.course.length; s += 1) if (plan.course[s] === course.id && plan.slot[s] >= 0) assert.equal(plan.room[s], other);
  });
});
