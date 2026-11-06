import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GRID, LEVELS, piecesOf } from "../src/grid.js";
import { createSchool } from "../src/school/generate.js";
import { DAYS, SLOTS, dayOf, fits, halfOf, hasLunch, hourOf, slotName, weeksOf } from "../src/time.js";

const halfHoursOf = (courses) => courses.reduce((sum, course) => sum + course.length * weeksOf(course.weeks).length, 0);

describe("the week", () => {
  it("has 40 one-hour slots, from 8 h, nothing on Wednesday afternoon", () => {
    assert.equal(DAYS.reduce((sum, day) => sum + day.count, 0), SLOTS);
    assert.equal(slotName(0), "lundi 8 h");
    assert.equal(slotName(21), "mercredi 11 h");
    assert.equal(slotName(22), "jeudi 8 h");
    assert.equal(hourOf(39), 16);
    assert.equal(hasLunch(2), false);
    assert.equal(hasLunch(0), true);
  });

  it("keeps a block inside its half-day and its day", () => {
    assert.ok(fits(0, 2));
    assert.equal(fits(3, 2), false, "11 h to 13 h crosses the morning");
    assert.ok(fits(4, 2));
    assert.equal(fits(8, 2), false, "16 h to 18 h leaves the day");
    assert.equal(fits(21, 2), false, "Wednesday ends at noon");
    assert.equal(fits(39, 2), false);
    assert.deepEqual([dayOf(9), halfOf(12), halfOf(13)], [1, 0, 1]);
  });
});

describe("the grid", () => {
  it("gives every level 26 hours", () => {
    for (const level of LEVELS) assert.equal(Object.values(GRID[level]).reduce((sum, n) => sum + n, 0), 52, `${level}e`);
  });

  it("cuts half-hours into one-week courses and EPS into 2 h blocks", () => {
    assert.deepEqual(piecesOf("fr", 9, 0).map((p) => p.weeks), ["AB", "AB", "AB", "AB", "A"]);
    assert.deepEqual(piecesOf("fr", 9, 1).at(-1), { length: 1, weeks: "B" });
    assert.deepEqual(piecesOf("eps", 8, 0), [{ length: 2, weeks: "AB" }, { length: 2, weeks: "AB" }]);
    assert.deepEqual(piecesOf("eps", 6, 1), [{ length: 2, weeks: "AB" }, { length: 2, weeks: "B" }]);
  });
});

describe("a fictitious collège", () => {
  const school = createSchool({ size: "M", seed: 7 });

  it("replays from its seed, and changes with it", () => {
    assert.deepEqual(createSchool({ size: "M", seed: 7 }), school);
    assert.notDeepEqual(createSchool({ size: "M", seed: 8 }).teachers, school.teachers);
  });

  it("has four divisions a level, each with its grid on both weeks", () => {
    assert.equal(school.divisions.length, 16);
    for (const division of school.divisions) {
      const courses = school.courses.filter((course) => course.divisions.includes(division.id));
      assert.equal(halfHoursOf(courses), 52, division.name);
      assert.ok(division.size >= 24 && division.size <= 30);
    }
  });

  it("gives each course a teacher of its discipline, the soutien to the mathematics teacher", () => {
    for (const course of school.courses) {
      const teacher = school.teachers[course.teacher];
      assert.equal(teacher.discipline, course.discipline === "sout" ? "ma" : course.discipline);
    }
  });

  it("keeps each teacher's load within one hour of the service, and sends the partial ones away a day", () => {
    for (const teacher of school.teachers) {
      const hours = halfHoursOf(school.courses.filter((course) => course.teacher === teacher.id)) / 2;
      assert.equal(hours, teacher.load);
      assert.ok(teacher.load <= teacher.service + 1, `${teacher.discipline} ${teacher.load}/${teacher.service}`);
      const away = teacher.unavailable.reduce((sum, n) => sum + n, 0);
      assert.equal(away, teacher.load <= teacher.service - 4 ? 9 : 0);
    }
  });

  it("has a home room per division, one to spare, and the specialised rooms", () => {
    const kinds = new Set(school.rooms.map((room) => room.kind));
    assert.deepEqual([...kinds].sort(), ["arts", "gym", "music", "ordinary", "pc", "svt", "tech"]);
    assert.equal(school.rooms.filter((room) => room.kind === "ordinary").length, 17);
    assert.deepEqual(school.divisions.map((d) => d.homeRoom), school.divisions.map((d) => d.id));
  });

  it("draws wishes on existing half-days only", () => {
    const wishes = school.teachers.map((teacher) => teacher.wish).filter(Boolean);
    assert.ok(wishes.length > 0);
    for (const { day, half } of wishes) assert.ok(half === 0 || hasLunch(day));
  });
});
