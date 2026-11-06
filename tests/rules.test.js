import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createBoard, place, remove, busy } from "../src/board.js";
import { breakKept, innerFree, popcount } from "../src/rules/day.js";
import { evaluate } from "../src/evaluate.js";
import { placeLink, reasonOf, tryCourse, tryLink } from "../src/rules/hard.js";
import { divisionHoles, longDay, repeats } from "../src/rules/division.js";
import { deltaOf, epsTooClose, lateHeavy, teacherHoles, wishBroken } from "../src/rules/soft.js";
import { partOf } from "../src/school/index.js";
import { createSchool } from "../src/school/generate.js";

const school = createSchool({ size: "S", seed: 3 });
const find = (test) => school.courses.find(test);
const sixieme = school.divisions.find((d) => d.level === 6);
const ofDivision = (division, discipline) => school.courses.filter((c) => c.divisions[0] === division.id && c.discipline === discipline);
const why = (board, course, slot) => reasonOf(tryCourse(board, course.id, slot));
const presentMonday = (course) => !school.teachers[course.teacher].unavailable[0];

describe("the day masks", () => {
  it("find the holes between the first and the last course", () => {
    assert.equal(popcount(0b101101), 4);
    assert.equal(innerFree(0b100101, 0, 9), 0b011010);
    assert.equal(innerFree(0b1101000, 3, 9), 0b0010000, "bits 3, 5 and 6: only 4 is inside");
    assert.equal(innerFree(0, 0, 9), 0);
  });

  it("keep a lunch break with two free slots in a row between 11 h and 14 h", () => {
    assert.ok(breakKept(0b000111));
    assert.ok(breakKept(0b100000));
    assert.equal(breakKept(0b010000), false);
    assert.equal(breakKept(0b001000 | 0b100000), false);
  });

  it("count a division's holes inside half-days only, a teacher's apart from two at lunch", () => {
    assert.equal(divisionHoles(0b1101, 0), 1);
    assert.equal(divisionHoles(0b110000011, 0), 0);
    assert.equal(teacherHoles(0b110000011, 0), 3);
    assert.equal(teacherHoles(0b000100001, 0), 2);
    assert.equal(longDay(0b11111111, 5), 1);
    assert.equal(longDay(0b11111111, 6), 0);
  });
});

describe("the hard constraints", () => {
  it("say why a course cannot start", () => {
    const board = createBoard(school);
    const [block] = ofDivision(sixieme, "eps");
    assert.equal(why(board, block, 3), "half-day");
    const french = ofDivision(sixieme, "fr");
    place(board, french[0].id, 0, sixieme.homeRoom);
    assert.equal(why(board, french[1], 0), "division");
    const colleague = find((c) => c.teacher === french[0].teacher && c.divisions[0] !== sixieme.id);
    assert.equal(why(board, colleague, 0), "teacher");
    remove(board, french[0].id);
    assert.ok(tryCourse(board, french[1].id, 0) >= 0);
  });

  it("keep the teacher's day away, the lunch break, and six hours for a 6e", () => {
    const board = createBoard(school);
    const away = school.teachers.find((t) => t.unavailable.some(Boolean));
    const course = find((c) => c.teacher === away.id);
    assert.equal(why(board, course, away.unavailable.indexOf(1)), "unavailable");
    const hours = school.courses.filter((c) => c.divisions[0] === sixieme.id && c.length === 1 && c.weeks === "AB" && presentMonday(c));
    hours.slice(0, 4).forEach((c, slot) => place(board, c.id, slot, roomOf(board, c, slot)));
    const fifth = hours[4];
    assert.equal(why(board, fifth, 4), "pause", "noon is always lunch: two free slots in a row include it");
    assert.equal(why(board, fifth, 5), "pause", "11 h and 13 h taken leave no two free slots in a row");
    place(board, fifth.id, 8, roomOf(board, fifth, 8));
    const block = ofDivision(sixieme, "eps").find(presentMonday);
    assert.equal(why(board, block, 6), "day-limit", "five hours placed and a 2 h block make seven");
  });

  it("refuse a slot when no room of the kind is free", () => {
    const only = school.rooms.find((room) => school.rooms.filter((r) => r.kind === room.kind).length === 1);
    const course = school.courses.find((c) => c.kind === only.kind && c.weeks === "AB");
    const slot = school.teachers[course.teacher].unavailable.indexOf(0);
    const squatter = school.courses.find((c) => c.divisions[0] !== course.divisions[0] && c.teacher !== course.teacher && c.length === 1);
    const board = createBoard(school);
    place(board, squatter.id, slot, only.id);
    assert.equal(why(board, course, slot), "room", `the only ${only.kind} room is taken`);
  });
});

function roomOf(board, course, slot) {
  const room = tryCourse(board, course.id, slot);
  assert.ok(room >= 0, `${course.discipline} at ${slot}: ${reasonOf(room)}`);
  return room;
}

describe("the soft constraints", () => {
  it("count a discipline twice in a day once per extra course, a block once", () => {
    const board = createBoard(school);
    const french = ofDivision(sixieme, "fr");
    place(board, french[0].id, 0, sixieme.homeRoom);
    place(board, french[1].id, 2, sixieme.homeRoom);
    assert.equal(repeats(board, partOf(sixieme.id, 0), 0, 0), 1);
    const block = ofDivision(sixieme, "eps").find(presentMonday);
    place(board, block.id, 6, roomOf(board, block, 6));
    assert.equal(repeats(board, partOf(sixieme.id, 0), 0, 0), 1);
  });

  it("count two EPS sessions less than 24 h apart, a wish broken, a heavy course late", () => {
    const board = createBoard(school);
    const [a, b] = ofDivision(sixieme, "eps");
    place(board, a.id, 0, roomOf(board, a, 0));
    place(board, b.id, 6, roomOf(board, b, 6));
    assert.equal(epsTooClose(board, sixieme.id, 0), 1, "Monday 8 h and 14 h");
    remove(board, b.id);
    place(board, b.id, 9, roomOf(board, b, 9));
    assert.equal(epsTooClose(board, sixieme.id, 0), 0, "Monday 8 h, Tuesday 8 h: 24 h apart");
    const teacher = { wish: { day: 1, half: 1 } };
    assert.equal(wishBroken(teacher, 0b000010000, 1), 1);
    assert.equal(wishBroken(teacher, 0b000001111, 1), 0);
    assert.equal(wishBroken({ wish: null }, 0b1, 1), 0);
    const french = ofDivision(sixieme, "fr")[0];
    assert.deepEqual([lateHeavy(french, 7), lateHeavy(french, 6), lateHeavy(a, 7)], [1, 0, 0]);
  });

  it("price a placement by what it adds, and leave the board as it was", () => {
    const board = createBoard(school);
    const french = ofDivision(sixieme, "fr");
    place(board, french[0].id, 0, sixieme.homeRoom);
    const spare = school.divisions.length;
    assert.equal(deltaOf(board, french[1].id, 1, sixieme.homeRoom), 4 * 2, "a repeat on both weeks");
    assert.equal(deltaOf(board, french[1].id, 2, spare), (10 + 3 + 4 + 1) * 2, "a hole for the division and the teacher, a repeat, away from home");
    assert.equal(busy(board.division, partOf(sixieme.id, 1), 0, 2), false);
  });
});

describe("the barrettes", () => {
  const small = createSchool({ size: "S", seed: 2 });
  const link = small.links.findIndex((ids) => {
    const first = small.courses[ids[0]];
    return first.discipline === "lv2" && first.divisions.length === 2 && first.weeks === "AB";
  });
  const [spanish, german] = small.links[link].map((id) => small.courses[id]);
  const open = (board) => {
    let slot = 0;
    while (tryLink(board, link, slot) !== 0) slot += 1;
    return slot;
  };

  it("start together, each group in its home room, the halves of both divisions taken", () => {
    const board = createBoard(small);
    const slot = open(board);
    assert.deepEqual([...board.rooms.slice(0, 2)], [spanish.home, german.home]);
    placeLink(board, link, slot);
    for (const division of spanish.divisions) {
      for (const half of [0, 1]) assert.ok(busy(board.division, partOf(division, half), 0, slot));
    }
    assert.deepEqual([board.slot[spanish.id], board.slot[german.id]], [slot, slot]);
  });

  it("are refused where one group's teacher is taken, and leave the board as it was", () => {
    const board = createBoard(small);
    const slot = open(board);
    const elsewhere = (c) => !c.divisions.some((d) => spanish.divisions.includes(d));
    const other = small.courses.find((c) => c.teacher === german.teacher && elsewhere(c) && c.length === 1 && c.weeks === "AB");
    place(board, other.id, slot, other.home);
    assert.equal(reasonOf(tryLink(board, link, slot)), "teacher");
    assert.equal(board.slot[spanish.id], -1);
    assert.equal(busy(board.division, partOf(spanish.divisions[0], 0), 0, slot), false);
  });

  it("count each course that does not start with the first one (D9)", () => {
    const timetable = { slot: new Int16Array(small.courses.length).fill(-1), room: new Int16Array(small.courses.length).fill(-1) };
    [timetable.slot[spanish.id], timetable.room[spanish.id]] = [0, spanish.home];
    [timetable.slot[german.id], timetable.room[german.id]] = [1, german.home];
    assert.equal(evaluate(small, timetable).hard.D9, 1);
  });
});
