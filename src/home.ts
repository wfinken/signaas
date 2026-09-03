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
 * Design notes, so the next person does not sand the edges off by accident:
 *
 * - Two typefaces, no more. Space Grotesk carries every heading; JetBrains Mono
 *   carries everything else, body copy included. Hierarchy comes from size and
 *   weight, never from stacking bold + italic + colour on the same run of text.
 * - Two background values: off-white and true black. Nothing in between.
 * - One accent, construction orange, spent only on primary actions, live state
 *   and failures. If it starts decorating things, it has stopped meaning anything.
 * - Every corner is square, every rule is 1px, and nothing floats on a shadow.
 *   The grid is the ornament: cells sit on a hairline background with a 1px gap.
 * - No transitions. Hover is a hard inversion that lands on the same frame as
 *   the pointer.
 */
const CSS = `
:root {
  color-scheme: light dark;
  --bg: #f9f9f9;
  --ink: #050505;
  --muted: #5f5f5f;
  --rule: #050505;
  --hair: #d8d8d4;
  --accent: #ff4a00;
  --accent-ink: #050505;
  --accent-text: #d13c00;
  --font-display: "Space Grotesk", "Inter Tight", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, "Cascadia Mono", monospace;
  --bar: 52px;
  --rail: 236px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #050505;
    --ink: #f4f4f2;
    --muted: #9a9a96;
    --rule: #f4f4f2;
    --hair: #2b2b29;
    --accent: #ff4a00;
    --accent-ink: #050505;
    --accent-text: #ff6a1f;
  }
}

* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 15px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, h4, .brand, .btn { font-family: var(--font-display); }
h1, h2, h3, h4 { margin: 0; font-weight: 700; letter-spacing: -0.03em; line-height: 1.05; }
h1 { font-size: clamp(38px, 6vw, 68px); }
h2 { font-size: clamp(26px, 3.4vw, 38px); }
h3 { font-size: 20px; letter-spacing: -0.02em; }
h4 { font-size: 17px; letter-spacing: -0.02em; }
p { margin: 0; }
a { color: inherit; text-decoration: none; border-bottom: 1px solid var(--accent); }
a:hover { background: var(--accent); color: var(--accent-ink); border-bottom-color: var(--accent); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
code, pre, .mono { font-family: var(--font-mono); }
code { font-size: 0.92em; }

/* Small uppercase mono labels do the signposting everywhere on the page. */
.tag {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 500;
}
.tag.on { color: var(--accent-text); }

.skip {
  position: absolute; left: -9999px; top: 0; z-index: 20;
  background: var(--accent); color: var(--accent-ink); padding: 10px 16px; border: 0;
}
.skip:focus { left: 0; }

/* ---------------------------------------------------------------- top bar */
.topbar {
  position: sticky; top: 0; z-index: 10;
  height: var(--bar);
  display: flex; align-items: center; gap: 20px;
  padding: 0 20px;
  background: var(--bg);
  border-bottom: 1px solid var(--rule);
}
.brand { font-size: 17px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; }
.brand b { color: var(--muted); font-weight: 500; }
.topbar .links { margin-left: auto; display: flex; gap: 0; }
.topbar .links a {
  border: 0; color: var(--muted); font-size: 12px; padding: 6px 12px; white-space: nowrap;
}
.topbar .links a:hover { background: var(--ink); color: var(--bg); }
.live { display: flex; align-items: center; gap: 8px; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; }
.dot { width: 8px; height: 8px; background: var(--accent); display: block; }

/* ------------------------------------------------------------------ shell */
.shell { display: grid; grid-template-columns: var(--rail) minmax(0, 1fr); }
.rail {
  border-right: 1px solid var(--rule);
  position: sticky; top: var(--bar);
  height: calc(100vh - var(--bar));
  padding: 34px 0 24px;
  display: flex; flex-direction: column; gap: 28px;
}
.rail .tag { padding: 0 22px; }
.rail nav { display: flex; flex-direction: column; }
.rail nav a {
  border: 0; border-left: 3px solid transparent;
  padding: 9px 22px; color: var(--muted); font-size: 13px;
  display: flex; gap: 12px; letter-spacing: 0.04em; text-transform: uppercase;
}
.rail nav a:hover { background: var(--ink); color: var(--bg); border-left-color: var(--ink); }
.rail nav a[aria-current=true] { color: var(--ink); border-left-color: var(--accent); }
.rail nav a[aria-current=true]:hover { color: var(--bg); }
.rail nav a i { font-style: normal; color: var(--muted); }
.rail nav a:hover i { color: var(--bg); }
.rail-foot { margin-top: auto; padding: 0 22px; color: var(--muted); font-size: 12px; line-height: 2; }

main { min-width: 0; }
section { padding: 84px 56px; border-bottom: 1px solid var(--rule); scroll-margin-top: var(--bar); }
.sect-head { max-width: 62ch; }
.sect-head .tag { display: block; margin-bottom: 18px; }
.lede { color: var(--muted); margin-top: 20px; max-width: 66ch; }

/* ------------------------------------------------------------------- hero */
.hero { padding-top: 108px; padding-bottom: 96px; }
.hero h1 { max-width: 16ch; }
.hero .lede { font-size: 17px; margin-top: 32px; }
.hero .curl {
  margin-top: 44px; border: 1px solid var(--rule); padding: 18px 22px;
  display: flex; gap: 16px; align-items: baseline; overflow-x: auto; white-space: nowrap;
}
.hero .curl span { color: var(--muted); }
.facts {
  margin-top: 44px;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
  background: var(--hair); border: 1px solid var(--rule);
}
.facts div { background: var(--bg); padding: 22px 24px; }
.facts b { display: block; font-family: var(--font-display); font-size: 30px; font-weight: 700; letter-spacing: -0.03em; }
.facts .tag { display: block; margin-top: 8px; }

/* ---------------------------------------------------------------- console */
.console { margin-top: 40px; border: 1px solid var(--rule); }
.fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: var(--hair); }
.field { background: var(--bg); padding: 18px 22px; position: relative; }
.field:focus-within { outline: 2px solid var(--accent); outline-offset: -2px; }
.field label { display: block; margin-bottom: 8px; }
.field input, .field select {
  width: 100%; border: 0; background: transparent; color: var(--ink);
  font-family: var(--font-mono); font-size: 15px; padding: 0;
  appearance: none; -webkit-appearance: none; border-radius: 0;
}
.field input:focus, .field select:focus { outline: none; }
.field input::placeholder { color: var(--muted); }
.field.pick::after {
  content: "▾"; position: absolute; right: 20px; bottom: 16px;
  color: var(--muted); pointer-events: none;
}
.field select { padding-right: 26px; text-overflow: ellipsis; }
.field select option { background: var(--bg); color: var(--ink); }

.controls { display: flex; flex-wrap: wrap; gap: 1px; background: var(--hair); border-top: 1px solid var(--hair); }
.btn {
  border: 0; background: var(--bg); color: var(--ink);
  font-size: 12px; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase;
  padding: 15px 24px; cursor: pointer; transition: none; flex: 1 1 auto; min-width: 120px;
}
.btn:hover { background: var(--ink); color: var(--bg); }
/* Selection inverts; the accent stays reserved for the primary action. */
.btn[aria-pressed=true] { background: var(--ink); color: var(--bg); }
.btn.go { background: var(--accent); color: var(--accent-ink); }
.btn.go:hover { background: var(--ink); color: var(--bg); }

.req {
  border-top: 1px solid var(--hair); padding: 16px 22px;
  display: flex; gap: 14px; align-items: baseline; overflow-x: auto; white-space: nowrap;
  font-size: 13px; color: var(--muted);
}
.req b { color: var(--ink); font-weight: 500; }

/* A 1px line that sweeps the width of the container instead of a spinner. */
.progress { height: 1px; background: var(--hair); }
.progress i { display: block; height: 1px; width: 0; background: var(--accent); }
.progress.run i { animation: sweep 700ms linear infinite; }
@keyframes sweep { from { width: 0; } to { width: 100%; } }

.panes { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--hair); }
.pane { background: var(--bg); min-width: 0; }
.pane-head {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 22px; border-bottom: 1px solid var(--hair);
}
.pane-head .copy {
  margin-left: auto; border: 1px solid var(--rule); background: var(--bg); color: var(--ink);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
  padding: 5px 12px; cursor: pointer; transition: none;
}
.pane-head .copy:hover { background: var(--ink); color: var(--bg); }
.pane-body { padding: 22px; overflow-x: auto; }
pre { margin: 0; font-size: 13.5px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
.preview p { margin: 0 0 4px; }
.hint { color: var(--muted); }
.hint.bad { color: var(--accent-text); }

/* A blinking terminal block, not a spinning circle. */
.cursor {
  display: inline-block; width: 0.62em; height: 1.05em; background: var(--ink);
  vertical-align: -0.18em; animation: blink 1s steps(1) infinite;
}
@keyframes blink { 50% { opacity: 0; } }

/* ----------------------------------------------------------------- tables */
.block-label { display: block; margin: 48px 0 14px; }
.block-label + .table-wrap, .block-label + .block { margin-top: 0; }
.table-wrap { overflow-x: auto; margin-top: 40px; border: 1px solid var(--rule); }
table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
th, td { text-align: left; padding: 14px 18px; border: 1px solid var(--hair); vertical-align: top; }
th { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); font-weight: 500; white-space: nowrap; }
td code { color: var(--ink); font-weight: 500; }
.block { margin-top: 40px; border: 1px solid var(--rule); padding: 24px; overflow-x: auto; }

/* --------------------------------------------------------------- category */
.cells { margin-top: 44px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--hair); border: 1px solid var(--rule); }
.cell { background: var(--bg); padding: 26px 24px 28px; }
.cell.filler { display: flex; align-items: flex-end; }
.cell.filler-narrow { display: none; }
.cell-head { display: flex; align-items: baseline; gap: 12px; }
.cell-head .tag { margin-left: auto; }
.cell .path { margin-top: 10px; font-size: 12.5px; color: var(--ink); font-weight: 500; }
.cell p { margin-top: 14px; color: var(--muted); font-size: 13px; }
.cell .sample { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--hair); font-size: 13px; }

footer { padding: 46px 56px 72px; display: flex; flex-wrap: wrap; gap: 10px 28px; color: var(--muted); font-size: 12.5px; }

@media (max-width: 1080px) {
  .cells { grid-template-columns: repeat(2, 1fr); }
  .cell.filler { display: none; }
  .cell.filler-narrow { display: flex; align-items: flex-end; }
  .panes { grid-template-columns: 1fr; }
}
@media (max-width: 860px) {
  .shell { grid-template-columns: 1fr; }
  .topbar .links a:not(:last-child) { display: none; }
  .rail {
    position: static; height: auto; border-right: 0; border-bottom: 1px solid var(--rule);
    flex-direction: row; align-items: center; gap: 0; padding: 0; overflow-x: auto;
  }
  .rail .tag, .rail-foot { display: none; }
  .rail nav { flex-direction: row; }
  .rail nav a { border-left: 0; border-bottom: 3px solid transparent; padding: 14px 18px; white-space: nowrap; }
  .rail nav a[aria-current=true] { border-bottom-color: var(--accent); }
  section, footer { padding-left: 22px; padding-right: 22px; }
  section { padding-top: 56px; padding-bottom: 56px; }
  .hero { padding-top: 64px; }
  .facts { grid-template-columns: repeat(2, 1fr); }
  .cells { grid-template-columns: 1fr; }
  .cell.filler-narrow { display: none; }
}
@media (max-width: 520px) {
  .fields { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .cursor { animation: none; }
  .progress.run i { animation: none; width: 100%; }
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

  /** Restarts the 1px sweep; reading offsetWidth forces the reflow. */
  function sweep() {
    progress.classList.remove("run");
    void progress.offsetWidth;
    progress.classList.add("run");
  }

  /** The sweep means "in flight", so it stops the moment the answer lands. */
  function settle() {
    progress.classList.remove("run");
  }

  function waiting() {
    out.textContent = "";
    out.appendChild(document.createElement("span")).className = "cursor";
    preview.textContent = "";
    status.textContent = "waiting";
    status.className = "tag";
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
    sweep();
    waiting();
    fetch(url, { headers: { accept: "application/json, text/plain, text/html" } })
      .then(function (response) {
        return response.text().then(function (body) {
          var took = Date.now() - started;
          settle();
          status.textContent = response.status + " · " + took + "ms";
          status.className = response.ok ? "tag" : "tag on";
          show(body);
        });
      })
      .catch(function () {
        settle();
        status.textContent = "no answer";
        status.className = "tag on";
        say(out, "The request went out and never came back. Check the network, then fire again.", true);
        say(preview, "Nothing to render until the wire behaves.", true);
      });
  }

  function show(body) {
    var pretty = body;
    if (format === "json") {
      try { pretty = JSON.stringify(JSON.parse(body), null, 2); } catch (error) { /* show raw */ }
    }
    if (!pretty.trim()) {
      say(out, "It's awfully quiet in here. Fire off a request to wake things up.");
      say(preview, "Nothing rendered yet.");
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

  say(out, "It's awfully quiet in here. Fire off a request to wake things up.");
  render();
})();
`;

function categoryCells(): string {
  return CATEGORY_SUMMARY.map(
    (category, index) => `
      <article class="cell">
        <div class="cell-head">
          <h4>${category.name}</h4>
          <span class="tag">${pad(index)}</span>
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
  const end = `<span class="tag">End of index · ${count}/${count}</span>`;
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap"/>
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
    <div class="tag">Index</div>
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
      <div class="tag">Signature as a Service</div>
      <h1>Sign off with exactly the energy the moment deserves.</h1>
      <p class="lede">
        One GET request returns a stylized sign-off as JSON, plain text or HTML.
        ${CATEGORY_SUMMARY.length} tones, from Business to Existential Dread. No key, no
        signup, no state to keep warm.
      </p>
      <div class="curl mono"><span>$</span>curl ${origin}/passive-aggressive/Alice</div>
      <div class="facts">
        <div><b>${CATEGORY_SUMMARY.length}</b><span class="tag">Tones</span></div>
        <div><b>${TEMPLATE_COUNT}</b><span class="tag">Templates</span></div>
        <div><b>3</b><span class="tag">Formats</span></div>
        <div><b>0</b><span class="tag">Signup steps</span></div>
      </div>
    </section>

    <section id="demo">
      <div class="sect-head">
        <span class="tag">00 — Console</span>
        <h2>Try it against this origin</h2>
        <p class="lede">
          Every keystroke fires a real request at the same endpoint your code will
          call. Nothing is mocked.
        </p>
      </div>

      <div class="console">
        <div class="fields">
          <div class="field pick">
            <label class="tag" for="category">Category</label>
            <select id="category"></select>
          </div>
          <div class="field">
            <label class="tag" for="name">Name</label>
            <input type="text" id="name" value="Ada" autocomplete="off" spellcheck="false"/>
          </div>
          <div class="field">
            <label class="tag" for="title">Title — optional</label>
            <input type="text" id="title" placeholder="VP of Sales" autocomplete="off"/>
          </div>
          <div class="field">
            <label class="tag" for="company">Company — optional</label>
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
              <span class="tag">Response</span>
              <span class="tag" id="status" aria-live="polite"></span>
              <button type="button" class="copy" id="copy">Copy</button>
            </div>
            <div class="pane-body"><pre id="output"></pre></div>
          </div>
          <div class="pane">
            <div class="pane-head"><span class="tag">Rendered</span></div>
            <div class="pane-body"><div class="preview" id="preview"></div></div>
          </div>
        </div>
      </div>
    </section>

    <section id="api">
      <div class="sect-head">
        <span class="tag">01 — API</span>
        <h2>One endpoint, three representations</h2>
        <p class="lede">
          The path picks the tone and the name. Query strings add optional detail.
          The <code>Accept</code> header picks the format.
        </p>
      </div>

      <span class="tag block-label">Endpoints</span>
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

      <span class="tag block-label">Query parameters</span>
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

      <span class="tag block-label">Content negotiation</span>
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
        <span class="tag">02 — Tones</span>
        <h2>${CATEGORY_SUMMARY.length} registers, ${TEMPLATE_COUNT} lines</h2>
        <p class="lede">
          Each tone holds a handful of templates; one is drawn per request, or
          pinned with <code>?seed=</code>.
        </p>
      </div>

      <div class="cells">${categoryCells()}${fillerCells()}</div>

      <span class="tag block-label">Slugs and aliases</span>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Slug</th><th>Templates</th><th>Also accepts</th></tr></thead>
          <tbody>${aliasRows()}</tbody>
        </table>
      </div>
    </section>

    <section id="limits">
      <div class="sect-head">
        <span class="tag">03 — Limits</span>
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

      <span class="tag block-label">Headers</span>
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
