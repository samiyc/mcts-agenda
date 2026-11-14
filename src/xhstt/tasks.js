/**
 * The tasks of the XHSTT solver (`layout.js`): an open event resource of a piece to fill, with its candidates, the
 * resources of its type that break the fewest required PreferResources constraints of its event and role (none, most
 * often; two lists that share no resource leave those that break one). A required AvoidSplitAssignments constraint
 * gathers the open resources of its role in all the pieces of its events into one task, filled by one resource, from
 * the candidates they share. Leaving a task empty (−1) is a candidate too: an instance can make it cheaper than any
 * resource (DK-HG-12, whose best solutions leave a room unassigned rather than break two lists of rooms).
 */

/** A union-find over `n` items. */
export function finder(n) {
  const parent = Int32Array.from({ length: n }, (_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]];
    return i;
  };
  const union = (a, b) => {
    parent[find(a)] = find(b);
  };
  return { find, union };
}

/**
 * The items of `base` that break the least weight of `rules` (`allows(rule, item)`): all of them when no rule is
 * broken, else those that break the fewest, by weight. Also that least weight.
 * @template T
 * @param {ArrayLike<T>} base
 * @param {{ weight: number }[]} rules
 * @param {(rule: any, item: T) => boolean} allows
 */
export function leastBroken(base, rules, allows) {
  const broken = Array.from(base, (item) => rules.reduce((sum, c) => (allows(c, item) ? sum : sum + c.weight), 0));
  const least = Math.min(...broken);
  return { kept: Array.from(base).filter((_, i) => broken[i] === least), least: base.length ? least : 0 };
}

function preferResourcesOf(instance) {
  const of = instance.events.list.map(() => []);
  for (const c of instance.constraints) if (c.kind === "PreferResources" && c.required) for (const e of c.points) of[e].push(c);
  return of;
}

/** The candidates of event resource `k` of `event`. */
function candidatesOf(instance, { prefer, byType }, event, k) {
  const er = instance.events.list[event].resources[k];
  const ofType = byType.get(er.type) ?? [];
  const rules = prefer[event].filter((c) => c.role === er.role);
  return leastBroken(ofType, rules, (c, r) => c.preferred[r] === 1).kept;
}

/** Every open (piece, event resource): `[piece, k]`, and where each is in that list. */
function openTargets(pieces) {
  const targets = [];
  const at = new Map();
  pieces.forEach((piece, i) => {
    piece.resources.forEach((r, k) => {
      if (r >= 0) return;
      at.set(i * 1024 + k, targets.length);
      targets.push([i, k]);
    });
  });
  return { targets, at };
}

/** Joins the targets that a required AvoidSplitAssignments constraint wants filled by one resource. */
function joinSplits(instance, { at, byEvent }, sets) {
  for (const c of instance.constraints) {
    if (c.kind !== "AvoidSplitAssignments" || !c.required) continue;
    for (const group of c.points) {
      const members = group.events.flatMap((e) => {
        const k = instance.events.list[e].resources.findIndex((er) => er.role === c.role && er.resource < 0);
        return k < 0 ? [] : byEvent[e].map((piece) => at.get(piece * 1024 + k));
      });
      for (const m of members) sets.union(m, members[0]);
    }
  }
}

/** The candidates the members of a task share, or the first member's when they share none; and −1, none. */
function sharedOf(lists) {
  const shared = lists.reduce((acc, list) => acc.filter((r) => list.includes(r)));
  return Int32Array.from([...(shared.length ? shared : lists[0]), -1]);
}

/**
 * The tasks; each piece's `tasks` gets the task of each of its open event resources.
 * @param {any} instance
 * @param {{ event: number, resources: Int32Array, tasks: Int32Array }[]} pieces
 * @param {number[][]} byEvent all the pieces of each event, idle ones too
 * @returns {{ targets: Int32Array, candidates: Int32Array }[]} each task's targets, as pairs (piece, k)
 */
export function tasksOf(instance, pieces, byEvent) {
  const { targets, at } = openTargets(pieces);
  const sets = finder(targets.length);
  joinSplits(instance, { at, byEvent }, sets);
  const byType = new Map();
  instance.resources.list.forEach((r, i) => byType.set(r.type, [...(byType.get(r.type) ?? []), i]));
  const context = { prefer: preferResourcesOf(instance), byType };
  const groups = new Map();
  targets.forEach((target, i) => {
    const root = sets.find(i);
    groups.set(root, [...(groups.get(root) ?? []), target]);
  });
  return [...groups.values()].map((members, task) => {
    for (const [piece, k] of members) pieces[piece].tasks[k] = task;
    return {
      targets: Int32Array.from(members.flat()),
      candidates: sharedOf(members.map(([piece, k]) => candidatesOf(instance, context, pieces[piece].event, k))),
    };
  });
}
