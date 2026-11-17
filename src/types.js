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
 * @property {Uint8Array} [away] 1 on a slot where it is to have no lesson (the sandbox, D11)
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
 * @property {Uint8Array} [avoid] 1 on a slot the teacher would rather keep free (the sandbox, S3)
 * @property {number} [dayMax] the most hours he teaches in a day (the sandbox, D10; six in EPS otherwise)
 */

/**
 * @typedef {object} Room
 * @property {number} id
 * @property {string} kind "ordinary", or a specialised kind ("svt", "pc", "tech", "arts", "music", "gym")
 * @property {string} name
 */

/**
 * What gets placed: the pupils of one division or of a group, one discipline, its teacher, a length, its weeks.
 * @typedef {object} Course
 * @property {number} id
 * @property {number[]} divisions whose pupils it takes: one, or several in a barrette across divisions (LV2)
 * @property {1 | 2 | 3} halves which halves of those divisions, as bits: 3 the whole division, 1 or 2 a half-group
 * @property {string} discipline
 * @property {number} teacher
 * @property {1 | 2} length in slots
 * @property {"AB" | "A" | "B"} weeks
 * @property {string} kind the room kind it needs
 * @property {number} link its barrette, an index of School.links: the courses of a link start together (D9)
 * @property {number} home the ordinary room it should keep (S7), or -1
 * @property {{ slot: number, room: number }} [fixed] where a lock keeps it (the sandbox): the rule puts it there, no search moves it
 * @property {number} [onlyRoom] the room the sandbox imposes on it (D3 otherwise)
 */

/**
 * @typedef {object} School a fictitious collège, drawn from its seed (src/school/generate.js)
 * @property {"S" | "M" | "L"} size
 * @property {number} seed
 * @property {Division[]} divisions
 * @property {Teacher[]} teachers
 * @property {Room[]} rooms
 * @property {Course[]} courses
 * @property {number[][]} links the courses of each barrette, a lone course its own; numbered in the order of the courses
 * @property {Record<string, number>} [weights] the soft weights, when the sandbox changes them (src/rules/soft.js WEIGHTS otherwise)
 */

/**
 * @typedef {object} Timetable where each course starts and in which room; -1 when it is not placed
 * @property {Int16Array} slot
 * @property {Int16Array} room
 */

/**
 * @typedef {object} Evaluation the two costs of a timetable, as XHSTT counts them: infeasibility first
 * @property {number} infeasibility the hard violations, D1 to D11
 * @property {number} cost the weighted soft violations, S1 to S8
 * @property {Record<string, number>} hard each hard constraint's count
 * @property {Record<string, number>} soft each soft constraint's count, before its weight
 */

/**
 * @typedef {object} Edits the sandbox's settings on a drawn collège (src/sandbox/edits.js), as JSON
 * @property {number} version
 * @property {"S" | "M" | "L"} size
 * @property {number} seed
 * @property {Record<string, number>} weights the soft weights changed
 * @property {Record<string, { away: number[], avoid: number[], dayMax?: number }>} teachers by teacher: slots elsewhere (D4), slots avoided (S3), the most hours a day (D10)
 * @property {Record<string, { away: number[] }>} divisions by division: slots kept from lessons (D11)
 * @property {Record<string, number>} rooms by course: the room imposed on it
 * @property {Record<string, { slot: number, room: number }>} locks by course: where it stays
 * @property {{ teacher: number, from: number, to: number, known: "veille" | "matin", told: "whole" | "daily" }[]} absences
 * @property {number} week 0 for A, 1 for B
 * @property {Record<string, number> | null} volunteers the hours each volunteer gives, or null for the collège's own
 */

export {};
