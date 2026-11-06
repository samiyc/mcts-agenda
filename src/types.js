/**
 * The shapes the modules hand each other, in JSDoc (`npm run types`). A module points here with
 * `@typedef {import("./types.js").Name} Name`. The model is docs/modele.md.
 */

/**
 * A class in the administrative sense (« la 5e B »): its pupils follow the common core together.
 * @typedef {object} Division
 * @property {number} id
 * @property {6 | 5 | 4 | 3} level
 * @property {string} name
 * @property {number} size the pupils, drawn from 24 to 30
 * @property {number} homeRoom the ordinary room it keeps (S7)
 */

/**
 * @typedef {object} Wish a half-day the teacher asks to keep free (S3)
 * @property {number} day index in DAYS
 * @property {0 | 1} half 0 the morning, 1 the afternoon
 */

/**
 * @typedef {object} Teacher
 * @property {number} id
 * @property {string} discipline a key of DISCIPLINES
 * @property {number} service the weekly hours owed: 18 (certifié) or 15 (agrégé)
 * @property {number} load the weekly hours given by the TRS, one above the service at most
 * @property {Uint8Array} unavailable 1 on a slot of the week where the teacher is elsewhere (D4)
 * @property {Wish | null} wish
 */

/**
 * @typedef {object} Room
 * @property {number} id
 * @property {string} kind "ordinary", or a specialised kind ("svt", "pc", "tech", "arts", "music", "gym")
 * @property {string} name
 */

/**
 * What gets placed: one division, one discipline, its teacher, a length, its weeks.
 * @typedef {object} Course
 * @property {number} id
 * @property {number} division
 * @property {string} discipline
 * @property {number} teacher
 * @property {1 | 2} length in slots
 * @property {"AB" | "A" | "B"} weeks
 * @property {string} kind the room kind it needs
 */

/**
 * @typedef {object} School a fictitious collège, drawn from its seed (src/school/generate.js)
 * @property {"S" | "M" | "L"} size
 * @property {number} seed
 * @property {Division[]} divisions
 * @property {Teacher[]} teachers
 * @property {Room[]} rooms
 * @property {Course[]} courses
 */

/**
 * @typedef {object} Timetable where each course starts and in which room; -1 when it is not placed
 * @property {Int16Array} slot
 * @property {Int16Array} room
 */

/**
 * @typedef {object} Evaluation the two costs of a timetable, as XHSTT counts them: infeasibility first
 * @property {number} infeasibility the hard violations, D1 to D8
 * @property {number} cost the weighted soft violations, S1 to S8
 * @property {Record<string, number>} hard each hard constraint's count
 * @property {Record<string, number>} soft each soft constraint's count, before its weight
 */

export {};
