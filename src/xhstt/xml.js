/**
 * A small XML reader, pure and without dependencies (docs/modele.md § 9), enough for XHSTT: elements, attributes,
 * text, comments, the declaration, CDATA and the five entities plus numeric ones. An element is
 * `{ name, attrs, children, text }`; `text` holds the element's own text, trimmed. No namespaces, no DTD.
 */
const ENTITIES = Object.freeze({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" });

/** Replaces the entities of a text or an attribute value. */
export function decode(raw) {
  if (!raw.includes("&")) return raw;
  return raw.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (whole, name) => {
    if (name[0] !== "#") return ENTITIES[name] ?? whole;
    return String.fromCodePoint(name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : Number(name.slice(1)));
  });
}

const element = (name, attrs) => ({ name, attrs, children: [], text: "" });

const SPACE = new Set([" ", "\t", "\n", "\r"]);

/** The attributes of a tag's body after its name: `key = "value"` or `key = 'value'`, scanned without a regex. */
function attributesOf(text) {
  const attrs = {};
  let i = 0;
  for (let eq = text.indexOf("=", i); eq >= 0; eq = text.indexOf("=", i)) {
    let open = eq + 1;
    while (SPACE.has(text[open])) open += 1;
    const close = text.indexOf(text[open], open + 1);
    attrs[text.slice(i, eq).trim()] = decode(text.slice(open + 1, close));
    i = close + 1;
  }
  return attrs;
}

function openTag(body) {
  const end = body.search(/[\s/]|$/);
  return element(body.slice(0, end), attributesOf(body.slice(end)));
}

/** The index past a markup that is not an element (comment, declaration, CDATA, doctype), its text kept in `top`. */
function skipSpecial(text, at, top) {
  if (text.startsWith("<!--", at)) return text.indexOf("-->", at) + 3;
  if (text.startsWith("<?", at)) return text.indexOf("?>", at) + 2;
  if (text.startsWith("<![CDATA[", at)) {
    const end = text.indexOf("]]>", at);
    top.text += text.slice(at + 9, end);
    return end + 3;
  }
  return text.indexOf(">", at) + 1;
}

function closeTag(stack, name) {
  const top = stack.pop();
  if (!top || top.name !== name) throw new Error(`XML : </${name}> ferme <${top?.name}>`);
  top.text = top.text.trim();
}

/** An element tag's body: opens an element, closes one, or both when it ends with « / ». */
function tag(stack, body) {
  if (body[0] === "/") return closeTag(stack, body.slice(1).trim());
  const selfClosing = body.endsWith("/");
  const node = openTag(selfClosing ? body.slice(0, -1) : body);
  stack[stack.length - 1].children.push(node);
  if (!selfClosing) stack.push(node);
}

/** Reads from `state.at` to past the next markup, the text before it kept in the open element. */
function step(state) {
  const { text, stack } = state;
  const top = stack[stack.length - 1];
  const lt = text.indexOf("<", state.at);
  const end = lt < 0 ? text.length : lt;
  if (end > state.at) top.text += decode(text.slice(state.at, end));
  if (lt < 0) state.at = text.length;
  else if (text[lt + 1] === "!" || text[lt + 1] === "?") state.at = skipSpecial(text, lt, top);
  else {
    const gt = text.indexOf(">", lt);
    state.at = gt + 1;
    tag(stack, text.slice(lt + 1, gt));
  }
}

/** The root element of an XML text. */
export function parseXml(text) {
  const state = { text, stack: [element("#document", {})], at: 0 };
  while (state.at < text.length) step(state);
  const { stack } = state;
  if (stack.length !== 1) throw new Error(`XML : <${stack[stack.length - 1].name}> jamais fermé`);
  const root = stack[0].children[0];
  if (!root) throw new Error("XML : aucun élément");
  return root;
}

/** The first child named `name`, or null. */
export const child = (node, name) => node?.children.find((c) => c.name === name) ?? null;
/** The children named `name`. */
export const childrenOf = (node, name) => (node ? node.children.filter((c) => c.name === name) : []);
/** The text of the first child named `name`, or `fallback`. */
export const textOf = (node, name, fallback = "") => child(node, name)?.text ?? fallback;
/** The `Reference` attributes of the children named `name` of the child named `list`. */
export const references = (node, list, name) => childrenOf(child(node, list), name).map((c) => c.attrs.Reference);
