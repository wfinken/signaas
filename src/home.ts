import { CATEGORIES } from "./categories";
import { buildSignature, toText } from "./signature";

/** Safe to embed inside a <script> tag: no closing tag can escape the string. */
function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const CATEGORY_SUMMARY = CATEGORIES.map((category) => ({
  slug: category.slug,
  name: category.name,
  description: category.description,
  aliases: category.aliases,
  templates: category.templates.length,
  example: toText(buildSignature(category, { name: "Ada" }, "homepage")).replace(/\n/g, " "),
}));

/** Two-digit index, so the grid reads like a schematic rather than a list. */
function pad(index: number): string {
  return String(index).padStart(2, "0");
}

/*
 * Design notes, so the next person does not sand the warmth off by accident.
 * The page should read as a quiet, well-made tool: cleanly engineered, and
 * subtly welcoming with it.
 *
 * - Two typefaces. DM Sans sets headings and interface text; a rounded mono
 *   (Cascadia Code or SF Mono where they are installed, Fira Code otherwise)
 *   sets anything a developer would copy. Order comes from weight and a muted
 *   text colour, never from shouting.
 * - Warm, muted colour. Paper is a warm off-white, ink a soft charcoal rather
 *   than pure black, and dark mode a soft deep slate. Borders are
 *   semi-transparent, so they read as a suggestion of structure.
 * - One accent, a soft terracotta, for primary actions and the API's own nouns.
 *   Sage marks healthy state; clay marks a failure. All three are muted.
 * - Modest 6px corners, generous padding, and shadows so diffused they only
 *   separate layers. The grid is still the frame, just drawn gently.
 * - Motion is 150ms ease-in-out: hover fades, it never inverts. A request in
 *   flight glides a slim accent bar and pulses skeleton lines, which reassure
 *   without demanding attention.
 */

const CSS = `
:root {
  color-scheme: light dark;
  --paper: #fdfcfb;
  --card: #ffffff;
  --sunk: #f7f5f2;
  --ink: #2c2a28;
  --ink-soft: #4b4744;
  --muted: #736e69;
  --line: rgba(44, 42, 40, 0.10);
  --line-soft: rgba(44, 42, 40, 0.06);
  --accent: #9d5b3f;
  --accent-hover: #874c33;
  --accent-soft: rgba(157, 91, 63, 0.10);
  --accent-line: rgba(157, 91, 63, 0.30);
  --on-accent: #fffaf7;
  --sage: #5f7360;
  --sage-soft: rgba(95, 115, 96, 0.13);
  --clay: #a1544b;
  --font-ui: "DM Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "Cascadia Code", "SF Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace;
  --radius: 6px;
  --radius-sm: 4px;
  --shadow: 0 1px 2px rgba(44, 42, 40, 0.03), 0 8px 24px rgba(44, 42, 40, 0.03);
  --ease: 150ms ease-in-out;
  --bar: 60px;
  --rail: 248px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --paper: #1c1c1e;
    --card: #232325;
    --sunk: #191919;
    --ink: #ece9e6;
    --ink-soft: #c9c5c1;
    --muted: #918c87;
    --line: rgba(236, 233, 230, 0.12);
    --line-soft: rgba(236, 233, 230, 0.07);
    --accent: #c98a69;
    --accent-hover: #d79b7c;
    --accent-soft: rgba(201, 138, 105, 0.14);
    --accent-line: rgba(201, 138, 105, 0.34);
    --on-accent: #1c1210;
    --sage: #8fa78f;
    --sage-soft: rgba(143, 167, 143, 0.16);
    --clay: #c9776c;
    --shadow: 0 1px 2px rgba(0, 0, 0, 0.24), 0 8px 24px rgba(0, 0, 0, 0.18);
  }
}

* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, h4 { margin: 0; font-weight: 600; letter-spacing: -0.015em; line-height: 1.2; }
h1 { font-size: clamp(32px, 4.4vw, 48px); font-weight: 600; letter-spacing: -0.022em; }
h2 { font-size: clamp(23px, 2.6vw, 30px); }
h3 { font-size: 19px; }
h4 { font-size: 16.5px; }
p { margin: 0; }
a {
  color: var(--accent); text-decoration: none;
  border-bottom: 1px solid var(--accent-line);
  transition: color var(--ease), border-color var(--ease);
}
a:hover { color: var(--accent-hover); border-bottom-color: var(--accent); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: var(--radius-sm); }
code, pre, .mono { font-family: var(--font-mono); }
code { font-size: 0.9em; }

/* Quiet mono labels signpost the page without raising their voice. */
.label {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  letter-spacing: 0.01em;
}
.label.warn { color: var(--clay); }
.label.ok { color: var(--sage); }

.skip {
  position: absolute; left: -9999px; top: 0; z-index: 20;
  background: var(--accent); color: var(--on-accent);
  padding: 10px 16px; border: 0; border-radius: 0 0 var(--radius) 0;
}
.skip:focus { left: 0; }

/* ---------------------------------------------------------------- top bar */
.topbar {
  position: sticky; top: 0; z-index: 10;
  height: var(--bar);
  display: flex; align-items: center; gap: 20px;
  padding: 0 24px;
  background: var(--paper);
  border-bottom: 1px solid var(--line-soft);
}
.brand { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; }
.brand b { color: var(--accent); font-weight: 600; }
.topbar .links { margin-left: auto; display: flex; gap: 2px; }
.topbar .links a {
  border: 0; border-radius: var(--radius-sm); color: var(--muted);
  font-family: var(--font-mono); font-size: 13px; padding: 7px 12px; white-space: nowrap;
  transition: background var(--ease), color var(--ease);
}
.topbar .links a:hover { background: var(--sunk); color: var(--ink-soft); }
.live {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--sage);
  background: var(--sage-soft); padding: 5px 12px 5px 10px; border-radius: var(--radius);
}
.dot { width: 7px; height: 7px; background: var(--sage); border-radius: 50%; display: block; }

/* ------------------------------------------------------------------ shell */
.shell { display: grid; grid-template-columns: var(--rail) minmax(0, 1fr); }
.rail {
  border-right: 1px solid var(--line-soft);
  position: sticky; top: var(--bar);
  height: calc(100vh - var(--bar));
  padding: 32px 0 28px;
  display: flex; flex-direction: column; gap: 14px;
}
.rail .label { padding: 0 26px; }
.rail nav { display: flex; flex-direction: column; gap: 2px; padding: 0 14px; }
.rail nav a {
  border: 0; border-radius: var(--radius); padding: 9px 12px;
  color: var(--muted); font-size: 15px; font-weight: 500;
  display: flex; gap: 12px; align-items: baseline;
  transition: background var(--ease), color var(--ease);
}
.rail nav a:hover { background: var(--sunk); color: var(--ink); }
.rail nav a[aria-current=true] { background: var(--accent-soft); color: var(--accent); }
.rail nav a i {
  font-style: normal; font-family: var(--font-mono); font-size: 12.5px; color: var(--muted);
}
.rail nav a[aria-current=true] i { color: var(--accent); }
.rail-foot {
  margin-top: auto; padding: 0 26px; color: var(--muted); font-size: 14px; line-height: 1.9;
}

main { min-width: 0; }
section {
  padding: 80px 60px; border-bottom: 1px solid var(--line-soft); scroll-margin-top: var(--bar);
}
.sect-head { max-width: 62ch; }
.sect-head .label { display: block; margin-bottom: 14px; }
.lede { color: var(--ink-soft); margin-top: 18px; max-width: 66ch; }

/* ------------------------------------------------------------------- hero */
.hero { padding-top: 96px; padding-bottom: 88px; }
.hero h1 { max-width: 18ch; }
.hero .lede { font-size: 18px; color: var(--ink-soft); margin-top: 24px; }
.hero .curl {
  margin-top: 36px; background: var(--card); border: 1px solid var(--line);
  border-radius: var(--radius); box-shadow: var(--shadow); padding: 18px 22px;
  display: flex; gap: 14px; align-items: baseline; overflow-x: auto; white-space: nowrap;
  font-size: 14px;
}
.hero .curl span { color: var(--accent); }
.facts {
  margin-top: 36px;
  display: grid; grid-template-columns: repeat(4, 1fr);
  background: var(--card); border: 1px solid var(--line);
  border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden;
}
.facts div { padding: 22px 26px; border-left: 1px solid var(--line-soft); }
.facts div:first-child { border-left: 0; }
.facts b { display: block; font-size: 30px; font-weight: 600; letter-spacing: -0.02em; }
.facts .label { display: block; margin-top: 4px; }

/* ---------------------------------------------------------------- console */
.console {
  margin-top: 32px; background: var(--card); border: 1px solid var(--line);
  border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden;
}
.fields { display: grid; grid-template-columns: repeat(2, 1fr); }
.field {
  padding: 18px 22px; position: relative;
  border-left: 1px solid var(--line-soft); border-bottom: 1px solid var(--line-soft);
  transition: background var(--ease);
}
.field:nth-child(odd) { border-left: 0; }
.field:focus-within { background: var(--sunk); }
.field label { display: block; margin-bottom: 6px; }
.field input, .field select {
  width: 100%; border: 0; background: transparent; color: var(--ink);
  font-family: var(--font-mono); font-size: 15px; padding: 0;
  appearance: none; -webkit-appearance: none; border-radius: 0;
}
.field input:focus, .field select:focus { outline: none; }
.field input::placeholder { color: var(--muted); }
.field.pick::after {
  content: "▾"; position: absolute; right: 22px; bottom: 17px;
  color: var(--muted); pointer-events: none;
}
.field select { padding-right: 26px; text-overflow: ellipsis; }
.field select option { background: var(--card); color: var(--ink); }

.controls {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  padding: 16px 22px; border-bottom: 1px solid var(--line-soft);
}
.btn {
  border: 1px solid var(--line); background: var(--card); color: var(--ink-soft);
  font-family: var(--font-ui); font-size: 14px; font-weight: 500;
  padding: 8px 16px; border-radius: var(--radius-sm); cursor: pointer;
  transition: background var(--ease), color var(--ease), border-color var(--ease);
}
.btn:hover { background: var(--sunk); color: var(--ink); }
.btn[aria-pressed=true] {
  background: var(--accent-soft); border-color: var(--accent-line); color: var(--accent);
}
.btn.go {
  margin-left: auto; background: var(--accent); border-color: var(--accent); color: var(--on-accent);
}
.btn.go:hover { background: var(--accent-hover); border-color: var(--accent-hover); }

.req {
  padding: 15px 22px; background: var(--sunk); border-bottom: 1px solid var(--line-soft);
  display: flex; gap: 12px; align-items: baseline; overflow-x: auto; white-space: nowrap;
  font-family: var(--font-mono); font-size: 13px; color: var(--muted);
}
.req b { color: var(--ink-soft); font-weight: 600; }

/* A slim bar that glides while a request is out, in the muted accent. */
.progress { height: 2px; background: var(--line-soft); overflow: hidden; }
.progress i {
  display: block; height: 2px; width: 34%; border-radius: 2px;
  background: var(--accent); opacity: 0; transform: translateX(-100%);
}
.progress.run i { opacity: 0.85; animation: glide 1.15s ease-in-out infinite; }
@keyframes glide {
  from { transform: translateX(-110%); }
  to { transform: translateX(320%); }
}

.panes { display: grid; grid-template-columns: 1fr 1fr; }
.pane { min-width: 0; border-left: 1px solid var(--line-soft); }
.pane:first-child { border-left: 0; }
.pane-head {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 22px; border-bottom: 1px solid var(--line-soft);
}
.pane-head .copy {
  margin-left: auto; border: 1px solid var(--line); background: var(--card); color: var(--muted);
  font-family: var(--font-ui); font-size: 13px; font-weight: 500;
  padding: 5px 12px; border-radius: var(--radius-sm); cursor: pointer;
  transition: background var(--ease), color var(--ease);
}
.pane-head .copy:hover { background: var(--sunk); color: var(--ink); }
.pane-body { padding: 22px; overflow-x: auto; min-height: 132px; }
pre { margin: 0; font-size: 13.5px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
.preview { font-size: 15px; }
.preview p { margin: 0 0 4px; }
.hint { color: var(--muted); }
.hint.bad { color: var(--clay); }

/* Skeleton lines pulse gently while the answer is on its way. */
.skeleton { display: grid; gap: 10px; }
.skeleton span {
  display: block; height: 11px; border-radius: var(--radius-sm);
  background: var(--line-soft); animation: breathe 1.6s ease-in-out infinite;
}
.skeleton span:nth-child(2) { animation-delay: 120ms; }
.skeleton span:nth-child(3) { animation-delay: 240ms; }
.skeleton span:nth-child(4) { animation-delay: 360ms; }
@keyframes breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* ----------------------------------------------------------------- tables */
.block-label { display: block; margin: 44px 0 12px; }
.block-label + .table-wrap, .block-label + .block { margin-top: 0; }
.table-wrap {
  overflow-x: auto; margin-top: 32px; background: var(--card);
  border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow);
}
table { width: 100%; border-collapse: collapse; font-size: 14.5px; }
th, td { text-align: left; padding: 14px 20px; border-bottom: 1px solid var(--line-soft); vertical-align: top; }
tr:last-child td { border-bottom: 0; }
th {
  font-family: var(--font-mono); font-size: 12px; font-weight: 500;
  color: var(--muted); white-space: nowrap; background: var(--sunk);
}
td { color: var(--ink-soft); }
td code { color: var(--accent); font-weight: 500; }
.block {
  margin-top: 32px; background: var(--card); border: 1px solid var(--line);
  border-radius: var(--radius); box-shadow: var(--shadow); padding: 24px; overflow-x: auto;
}

/* --------------------------------------------------------------- category */
.cells {
  margin-top: 36px; display: grid; grid-template-columns: repeat(3, 1fr);
  background: var(--card); border: 1px solid var(--line);
  border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden;
}
.cell {
  padding: 24px 24px 26px;
  border-left: 1px solid var(--line-soft); border-top: 1px solid var(--line-soft);
  transition: background var(--ease);
}
.cell:nth-child(3n + 1) { border-left: 0; }
.cell:nth-child(-n + 3) { border-top: 0; }
.cell:hover { background: var(--sunk); }
.cell.filler { display: flex; align-items: flex-end; background: var(--sunk); }
.cell.filler-narrow { display: none; }
.cell-head { display: flex; align-items: baseline; gap: 12px; }
.cell-head .label { margin-left: auto; }
.cell .path { margin-top: 6px; font-family: var(--font-mono); font-size: 13px; color: var(--accent); }
.cell p { margin-top: 12px; color: var(--muted); font-size: 14.5px; }
.cell .sample {
  margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line-soft);
  font-size: 14.5px; color: var(--ink-soft);
}

footer {
  padding: 40px 60px 72px; display: flex; flex-wrap: wrap; gap: 10px 26px;
  color: var(--muted); font-size: 14px;
}

@media (max-width: 1080px) {
  .cells { grid-template-columns: repeat(2, 1fr); }
  .cell:nth-child(3n + 1) { border-left: 1px solid var(--line-soft); }
  .cell:nth-child(-n + 3) { border-top: 1px solid var(--line-soft); }
  .cell:nth-child(odd) { border-left: 0; }
  .cell:nth-child(-n + 2) { border-top: 0; }
  .cell.filler { display: none; }
  .cell.filler-narrow { display: flex; align-items: flex-end; }
  .panes { grid-template-columns: 1fr; }
  .pane { border-left: 0; border-top: 1px solid var(--line-soft); }
  .pane:first-child { border-top: 0; }
}
@media (max-width: 860px) {
  .shell { grid-template-columns: 1fr; }
  .topbar { padding: 0 18px; }
  .topbar .links a:not(:last-child) { display: none; }
  .rail {
    position: static; height: auto; border-right: 0; border-bottom: 1px solid var(--line-soft);
    flex-direction: row; align-items: center; gap: 0; padding: 0; overflow-x: auto;
  }
  .rail .label, .rail-foot { display: none; }
  .rail nav { flex-direction: row; padding: 10px 12px; }
  .rail nav a { padding: 8px 14px; white-space: nowrap; }
  section, footer { padding-left: 22px; padding-right: 22px; }
  section { padding-top: 56px; padding-bottom: 56px; }
  .hero { padding-top: 64px; }
  .facts { grid-template-columns: repeat(2, 1fr); }
  .facts div:nth-child(odd) { border-left: 0; }
  .facts div:nth-child(n + 3) { border-top: 1px solid var(--line-soft); }
  .cells { grid-template-columns: 1fr; }
  .cell { border-left: 0; border-top: 1px solid var(--line-soft); }
  .cell:first-child { border-top: 0; }
  .cell.filler-narrow { display: none; }
}
@media (max-width: 620px) {
  /* Stranded on its own line, the primary action may as well span it. */
  .btn.go { margin-left: 0; flex: 1 1 100%; }
}
@media (max-width: 520px) {
  .fields { grid-template-columns: 1fr; }
  .field { border-left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton span { animation: none; }
  .progress.run i { animation: none; width: 100%; transform: none; }
}
`;

const SCRIPT = `
(function () {
  var categories = CATEGORY_DATA;
  var format = "json";
  var select = document.getElementById("category");
  var name = document.getElementById("name");
  var title = document.getElementById("title");
  var company = document.getElementById("company");
  var out = document.getElementById("output");
  var requestLine = document.getElementById("request");
  var preview = document.getElementById("preview");
  var status = document.getElementById("status");
  var progress = document.getElementById("progress");
  var copyButton = document.getElementById("copy");
  var buttons = Array.prototype.slice.call(document.querySelectorAll(".formats button"));
  var timer = null;

  categories.forEach(function (category) {
    var option = document.createElement("option");
    option.value = category.slug;
    option.textContent = category.name;
    select.appendChild(option);
  });
  select.value = "passive-aggressive";

  function buildUrl() {
    var path = "/" + encodeURIComponent(select.value) + "/" + encodeURIComponent(name.value || "Ada");
    var params = new URLSearchParams();
    if (title.value.trim()) params.set("title", title.value.trim());
    if (company.value.trim()) params.set("company", company.value.trim());
    params.set("format", format);
    return path + "?" + params.toString();
  }

  /** Restarts the gliding bar; reading offsetWidth forces the reflow. */
  function glide() {
    progress.classList.remove("run");
    void progress.offsetWidth;
    progress.classList.add("run");
  }

  /** The bar means "in flight", so it stops the moment the answer lands. */
  function settle() {
    progress.classList.remove("run");
  }

  /** Placeholder lines, roughly the shape of the answer that is coming. */
  function skeleton(element, widths) {
    element.textContent = "";
    var block = document.createElement("div");
    block.className = "skeleton";
    widths.forEach(function (width) {
      var line = document.createElement("span");
      line.style.width = width;
      block.appendChild(line);
    });
    element.appendChild(block);
  }

  function waiting() {
    skeleton(out, ["22%", "86%", "64%", "18%"]);
    skeleton(preview, ["78%", "34%"]);
    status.textContent = "working on it";
    status.className = "label";
  }

  function say(element, text, bad) {
    element.textContent = "";
    var span = document.createElement("span");
    span.className = bad ? "hint bad" : "hint";
    span.textContent = text;
    element.appendChild(span);
  }

  function render() {
    var url = buildUrl();
    var started = Date.now();
    requestLine.textContent = url;
    glide();
    waiting();
    fetch(url, { headers: { accept: "application/json, text/plain, text/html" } })
      .then(function (response) {
        return response.text().then(function (body) {
          var took = Date.now() - started;
          settle();
          status.textContent = response.status + " · " + took + "ms";
          status.className = response.ok ? "label ok" : "label warn";
          show(body);
        });
      })
      .catch(function () {
        settle();
        status.textContent = "no answer";
        status.className = "label warn";
        say(out, "That request did not make it back. Check the connection and give it another go.", true);
        say(preview, "Nothing to preview until the request lands.", true);
      });
  }

  function show(body) {
    var pretty = body;
    if (format === "json") {
      try { pretty = JSON.stringify(JSON.parse(body), null, 2); } catch (error) { /* show raw */ }
    }
    if (!pretty.trim()) {
      say(out, "It's a little quiet in here right now. Let's get your first request set up.");
      say(preview, "The rendered signature will appear here.");
      return;
    }
    out.textContent = pretty;
    preview.textContent = "";
    if (format === "html") {
      preview.innerHTML = body;
      return;
    }
    var text = format === "json" ? jsonToText(body) : body;
    text.split("\\n").forEach(function (line) {
      var p = document.createElement("p");
      p.textContent = line;
      preview.appendChild(p);
    });
  }

  function jsonToText(body) {
    try {
      var parsed = JSON.parse(body);
      return [parsed.message, parsed.subtitle].filter(Boolean).join("\\n");
    } catch (error) {
      return body;
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(render, 180);
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      if (button.id === "shuffle") { render(); return; }
      format = button.dataset.format;
      buttons.forEach(function (other) {
        if (other.dataset.format) other.setAttribute("aria-pressed", String(other === button));
      });
      render();
    });
  });

  copyButton.addEventListener("click", function () {
    navigator.clipboard.writeText(out.textContent || "").then(function () {
      copyButton.textContent = "Copied";
      setTimeout(function () { copyButton.textContent = "Copy"; }, 1200);
    });
  });

  [name, title, company].forEach(function (field) {
    field.addEventListener("input", schedule);
    field.addEventListener("keydown", function (event) {
      if (event.key === "Enter") { event.preventDefault(); clearTimeout(timer); render(); }
    });
  });
  select.addEventListener("change", render);

  /* The rail marks whichever section currently sits under the top bar. */
  var links = Array.prototype.slice.call(document.querySelectorAll(".rail nav a"));
  var marks = links.map(function (link) {
    return { link: link, target: document.getElementById(link.getAttribute("href").slice(1)) };
  }).filter(function (mark) { return mark.target; });
  var queued = false;

  function mark() {
    queued = false;
    var current = marks[0];
    var atEnd = window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
    marks.forEach(function (candidate) {
      if (candidate.target.getBoundingClientRect().top <= 120) current = candidate;
    });
    if (atEnd) current = marks[marks.length - 1];
    marks.forEach(function (candidate) {
      candidate.link.setAttribute("aria-current", String(candidate === current));
    });
  }

  window.addEventListener("scroll", function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(mark);
  }, { passive: true });
  window.addEventListener("resize", mark);
  mark();

  say(out, "It's a little quiet in here right now. Let's get your first request set up.");
  render();
})();
`;

function categoryCells(): string {
  return CATEGORY_SUMMARY.map(
    (category, index) => `
      <article class="cell">
        <div class="cell-head">
          <h4>${category.name}</h4>
          <span class="label">${pad(index)}</span>
        </div>
        <div class="path">/${category.slug}/:name</div>
        <p>${category.description}</p>
        <div class="sample">${category.example}</div>
      </article>`,
  ).join("");
}

/**
 * Closes the last row of the cell grid, so a ragged row never shows the grid's
 * own hairline background as a hole. The wide layout is three columns, the
 * narrower one two, and the fillers are hidden when they are not needed.
 */
function fillerCells(): string {
  const count = CATEGORY_SUMMARY.length;
  const end = `<span class="label">That\u2019s all ${count} of them.</span>`;
  const fill = (columns: number, className: string) =>
    Array.from({ length: (columns - (count % columns)) % columns }, (_unused, index) => `
      <div class="cell ${className}" aria-hidden="true">${index === 0 ? end : ""}</div>`).join("");
  return fill(3, "filler") + fill(2, "filler-narrow");
}

function aliasRows(): string {
  return CATEGORY_SUMMARY.map(
    (category) => `
      <tr>
        <td><code>${category.slug}</code></td>
        <td>${category.templates}</td>
        <td>${category.aliases.map((alias) => `<code>${alias}</code>`).join(" ") || "&mdash;"}</td>
      </tr>`,
  ).join("");
}

const TEMPLATE_COUNT = CATEGORY_SUMMARY.reduce((total, category) => total + category.templates, 0);

export function renderHomepage(origin: string, canonical: string): string {
  const host = canonical.replace(/^https?:\/\//, "");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>SignaaS — Signature as a Service</title>
<meta name="description" content="A tiny REST API that returns stylized email sign-offs in JSON, plain text or HTML. Dozens of tones, one URL."/>
<meta property="og:title" content="SignaaS — Signature as a Service"/>
<meta property="og:description" content="GET /passive-aggressive/Alice. Stylized sign-offs as a service."/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="${canonical}/"/>
<meta name="twitter:card" content="summary"/>
<link rel="canonical" href="${canonical}/"/>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%E2%9C%8D%EF%B8%8F%3C/text%3E%3C/svg%3E"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Fira+Code:wght@400;500&display=swap"/>
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<header class="topbar">
  <div class="brand">Signa<b>aS</b></div>
  <div class="links mono">
    <a href="/categories">/categories</a>
    <a href="/openapi.json">/openapi.json</a>
    <a href="/health">/health</a>
  </div>
  <div class="live"><span class="dot"></span>Live</div>
</header>

<div class="shell">
  <aside class="rail">
    <div class="label">Index</div>
    <nav>
      <a href="#demo" aria-current="true"><i>00</i>Console</a>
      <a href="#api"><i>01</i>API</a>
      <a href="#categories"><i>02</i>Tones</a>
      <a href="#limits"><i>03</i>Limits</a>
    </nav>
    <div class="rail-foot">
      Cloudflare Workers<br/>
      Stateless · MIT<br/>
      ${CATEGORY_SUMMARY.length} tones · ${TEMPLATE_COUNT} templates
    </div>
  </aside>

  <main id="main">
    <section class="hero">
      <div class="label">Signature as a Service</div>
      <h1>Sign off with exactly the energy the moment deserves.</h1>
      <p class="lede">
        One GET request returns a stylized sign-off as JSON, plain text or HTML.
        ${CATEGORY_SUMMARY.length} tones, from Business to Existential Dread. No key, no
        signup, no state to keep warm.
      </p>
      <div class="curl mono"><span>$</span>curl ${origin}/passive-aggressive/Alice</div>
      <div class="facts">
        <div><b>${CATEGORY_SUMMARY.length}</b><span class="label">Tones</span></div>
        <div><b>${TEMPLATE_COUNT}</b><span class="label">Templates</span></div>
        <div><b>3</b><span class="label">Formats</span></div>
        <div><b>0</b><span class="label">Signup steps</span></div>
      </div>
    </section>

    <section id="demo">
      <div class="sect-head">
        <span class="label">00 — Console</span>
        <h2>Try it against this origin</h2>
        <p class="lede">
          Every keystroke fires a real request at the same endpoint your code will
          call. Nothing is mocked.
        </p>
      </div>

      <div class="console">
        <div class="fields">
          <div class="field pick">
            <label class="label" for="category">Category</label>
            <select id="category"></select>
          </div>
          <div class="field">
            <label class="label" for="name">Name</label>
            <input type="text" id="name" value="Ada" autocomplete="off" spellcheck="false"/>
          </div>
          <div class="field">
            <label class="label" for="title">Title — optional</label>
            <input type="text" id="title" placeholder="VP of Sales" autocomplete="off"/>
          </div>
          <div class="field">
            <label class="label" for="company">Company — optional</label>
            <input type="text" id="company" placeholder="Initech" autocomplete="off"/>
          </div>
        </div>

        <div class="controls formats">
          <button class="btn" type="button" data-format="json" aria-pressed="true">JSON</button>
          <button class="btn" type="button" data-format="text" aria-pressed="false">Plain text</button>
          <button class="btn" type="button" data-format="html" aria-pressed="false">HTML</button>
          <button class="btn go" type="button" id="shuffle">Shuffle</button>
        </div>

        <div class="req mono"><b>GET</b><span id="request"></span></div>
        <div class="progress" id="progress" aria-hidden="true"><i></i></div>

        <div class="panes">
          <div class="pane">
            <div class="pane-head">
              <span class="label">Response</span>
              <span class="label" id="status" aria-live="polite"></span>
              <button type="button" class="copy" id="copy">Copy</button>
            </div>
            <div class="pane-body"><pre id="output"></pre></div>
          </div>
          <div class="pane">
            <div class="pane-head"><span class="label">Rendered</span></div>
            <div class="pane-body"><div class="preview" id="preview"></div></div>
          </div>
        </div>
      </div>
    </section>

    <section id="api">
      <div class="sect-head">
        <span class="label">01 — API</span>
        <h2>One endpoint, three representations</h2>
        <p class="lede">
          The path picks the tone and the name. Query strings add optional detail.
          The <code>Accept</code> header picks the format.
        </p>
      </div>

      <span class="label block-label">Endpoints</span>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Endpoint</th><th>Returns</th></tr></thead>
          <tbody>
            <tr><td><code>GET /:category/:name</code></td><td>A signature in the negotiated format</td></tr>
            <tr><td><code>GET /categories</code></td><td>JSON list of every category, alias and template count</td></tr>
            <tr><td><code>GET /random/:name</code></td><td>A signature from a randomly chosen category</td></tr>
            <tr><td><code>GET /openapi.json</code></td><td>OpenAPI 3.1 description of this service</td></tr>
            <tr><td><code>GET /health</code></td><td>Liveness probe</td></tr>
          </tbody>
        </table>
      </div>

      <span class="label block-label">Query parameters</span>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Parameter</th><th>Effect</th></tr></thead>
          <tbody>
            <tr><td><code>title</code></td><td>Appended to the attribution, and italicised in HTML output</td></tr>
            <tr><td><code>company</code></td><td>Appended after the title</td></tr>
            <tr><td><code>recipient</code></td><td>Available to templates that address someone directly</td></tr>
            <tr><td><code>format</code></td><td><code>json</code>, <code>text</code> or <code>html</code>; overrides <code>Accept</code></td></tr>
            <tr><td><code>seed</code></td><td>Pins the template choice, so the same seed always returns the same line</td></tr>
          </tbody>
        </table>
      </div>

      <span class="label block-label">Content negotiation</span>
      <div class="block">
<pre>$ curl -H 'Accept: application/json' ${origin}/passive-aggressive/Alice
{
  "message": "I trust you can figure it out from here.",
  "subtitle": "— Alice"
}

$ curl -H 'Accept: text/plain' ${origin}/pirate/Blackbeard
May yer anchor be tight and yer compass true.
— Cap'n Blackbeard

$ curl -H 'Accept: text/html' '${origin}/business/John?title=VP%20of%20Sales'
&lt;p&gt;Yours in synergy,&lt;/p&gt;
&lt;p&gt;&lt;strong&gt;John&lt;/strong&gt;&lt;br/&gt;&lt;em&gt;VP of Sales&lt;/em&gt;&lt;/p&gt;</pre>
      </div>
    </section>

    <section id="categories">
      <div class="sect-head">
        <span class="label">02 — Tones</span>
        <h2>${CATEGORY_SUMMARY.length} registers, ${TEMPLATE_COUNT} lines</h2>
        <p class="lede">
          Each tone holds a handful of templates; one is drawn per request, or
          pinned with <code>?seed=</code>.
        </p>
      </div>

      <div class="cells">${categoryCells()}${fillerCells()}</div>

      <span class="label block-label">Slugs and aliases</span>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Slug</th><th>Templates</th><th>Also accepts</th></tr></thead>
          <tbody>${aliasRows()}</tbody>
        </table>
      </div>
    </section>

    <section id="limits">
      <div class="sect-head">
        <span class="label">03 — Limits</span>
        <h2>100 requests per hour, per IP</h2>
        <p class="lede">
          Responses carry <code>X-RateLimit-Limit</code>,
          <code>X-RateLimit-Remaining</code> and <code>X-RateLimit-Reset</code>.
          Going over returns <code>429</code> with a <code>Retry-After</code>
          header. Paid keys travel in <code>Authorization: Bearer &lt;key&gt;</code>
          and skip the limit entirely.
        </p>
        <p class="lede">CORS is wide open, so browser code can call the API directly.</p>
      </div>

      <span class="label block-label">Headers</span>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Header</th><th>On every response</th></tr></thead>
          <tbody>
            <tr><td><code>X-RateLimit-Limit</code></td><td>Requests allowed in the current window</td></tr>
            <tr><td><code>X-RateLimit-Remaining</code></td><td>What is left of that allowance</td></tr>
            <tr><td><code>X-RateLimit-Reset</code></td><td>Unix seconds at which the window rolls over</td></tr>
            <tr><td><code>Retry-After</code></td><td>Seconds to wait — sent with <code>429</code> only</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <footer>
      <a href="${canonical}/">${host}</a>
      <span>Signature as a Service</span>
      <span>Cloudflare Workers</span>
      <span>MIT licensed</span>
    </footer>
  </main>
</div>

<script>${SCRIPT.replace("CATEGORY_DATA", () => jsonForScript(CATEGORY_SUMMARY))}</script>
</body>
</html>`;
}
