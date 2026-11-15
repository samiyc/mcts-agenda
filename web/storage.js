import { emptyEdits, readEdits } from "../src/sandbox/edits.js";

/**
 * Where the sandbox keeps its settings (docs/modele.md § 14): the browser, one entry by collège and seed, and a JSON
 * file to export and import. The browser may refuse (a private window, cleared data): the page works without it,
 * from empty settings.
 */
const keyOf = (size, seed) => `agenda.reglages.${size}-${seed}`;

/** The settings kept for the collège `drawn`, or empty ones. */
export function loadEdits(drawn) {
  try {
    const text = localStorage.getItem(keyOf(drawn.size, drawn.seed));
    if (text) return readEdits(JSON.parse(text), drawn);
  } catch {
    // Nothing kept, or kept by an older page: start from empty settings.
  }
  return emptyEdits(drawn.size, drawn.seed);
}

/** Keeps the settings in the browser, when it lets us. */
export function saveEdits(edits) {
  try {
    localStorage.setItem(keyOf(edits.size, edits.seed), JSON.stringify(edits));
  } catch {
    // The browser refuses: the settings live as long as the page.
  }
}

/** Hands the settings over as a file, `agenda-reglages-M-1.json`. */
export function exportEdits(edits) {
  const blob = new Blob([JSON.stringify(edits, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `agenda-reglages-${edits.size}-${edits.seed}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** The settings of a file, as JSON; `readEdits` checks them once the collège they name is drawn. */
export async function readFile(file) {
  return JSON.parse(await file.text());
}
