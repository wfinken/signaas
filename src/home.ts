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

const CSS = `
:root {
  color-scheme: light dark;
  --bg: #f7f6f3;
  --panel: #ffffff;
  --ink: #17161a;
  --muted: #5f5c68;
  --line: #e3e0da;
  --accent: #b8482f;
  --accent-soft: #fbeee9;
  --code-bg: #17161a;
  --code-ink: #f2efe9;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #121116;
    --panel: #1b1a21;
    --ink: #f2efe9;
    --muted: #a29daf;
    --line: #2e2c38;
    --accent: #ff8a66;
    --accent-soft: #2a1f1c;
    --code-bg: #0d0c10;
    --code-ink: #f2efe9;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font: 16px/1.6 ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); }
code, pre, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, "Cascadia Mono", monospace; }
.wrap { max-width: 940px; margin: 0 auto; padding: 0 20px; }
header.top {
  border-bottom: 1px solid var(--line);
  background: var(--panel);
  position: sticky;
  top: 0;
  z-index: 5;
}
header.top .wrap { display: flex; align-items: center; gap: 16px; height: 60px; }
.brand { font-weight: 700; letter-spacing: -0.02em; font-size: 18px; }
.brand span { color: var(--accent); }
header.top nav { margin-left: auto; display: flex; gap: 18px; font-size: 14px; }
header.top nav a { color: var(--muted); text-decoration: none; }
header.top nav a:hover { color: var(--ink); }
.hero { padding: 56px 0 24px; }
h1 { font-size: clamp(32px, 5vw, 48px); line-height: 1.1; letter-spacing: -0.03em; margin: 0 0 12px; }
.tagline { font-size: 18px; color: var(--muted); margin: 0 0 8px; max-width: 62ch; }
.pill {
  display: inline-block; background: var(--accent-soft); color: var(--accent);
  border-radius: 999px; padding: 4px 12px; font-size: 13px; font-weight: 600; margin-bottom: 18px;
}
.demo {
  background: var(--panel); border: 1px solid var(--line); border-radius: 14px;
  padding: 20px; margin: 28px 0 8px;
}
.fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
label { display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 6px; }
select, input[type=text] {
  width: 100%; padding: 10px 12px; border-radius: 9px; border: 1px solid var(--line);
  background: var(--bg); color: var(--ink); font-size: 15px;
}
.formats { display: flex; gap: 8px; margin: 16px 0 12px; flex-wrap: wrap; }
.formats button, .copy {
  border: 1px solid var(--line); background: var(--bg); color: var(--muted);
  border-radius: 999px; padding: 6px 14px; font-size: 13px; cursor: pointer;
}
.formats button[aria-pressed=true] { background: var(--accent); border-color: var(--accent); color: #fff; }
.request { font-size: 13px; color: var(--muted); word-break: break-all; margin-bottom: 10px; }
pre {
  background: var(--code-bg); color: var(--code-ink); padding: 16px; border-radius: 11px;
  overflow-x: auto; font-size: 14px; margin: 0;
}
.out-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.out-head strong { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 600; }
.copy { margin-left: auto; }
.preview {
  border: 1px dashed var(--line); border-radius: 11px; padding: 14px 16px; margin-top: 12px; background: var(--bg);
}
.preview p { margin: 0 0 4px; }
section { padding: 34px 0; border-top: 1px solid var(--line); scroll-margin-top: 60px; }
.demo { scroll-margin-top: 76px; }
h2 { font-size: 24px; letter-spacing: -0.02em; margin: 0 0 6px; }
h3 { font-size: 16px; margin: 26px 0 8px; }
.lede { color: var(--muted); margin: 0 0 18px; max-width: 68ch; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
td code { background: var(--accent-soft); color: var(--accent); padding: 1px 6px; border-radius: 5px; font-size: 13px; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; }
.card h4 { margin: 0 0 2px; font-size: 15px; }
.card .slug { font-size: 12px; color: var(--accent); }
.card p { margin: 6px 0 0; font-size: 13px; color: var(--muted); }
.card .sample { margin-top: 8px; font-size: 13px; font-style: italic; }
footer { padding: 30px 0 60px; color: var(--muted); font-size: 14px; border-top: 1px solid var(--line); }
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

  function render() {
    var url = buildUrl();
    requestLine.textContent = "GET " + url;
    fetch(url, { headers: { accept: "application/json, text/plain, text/html" } })
      .then(function (response) { return response.text(); })
      .then(function (body) {
        var pretty = body;
        if (format === "json") {
          try { pretty = JSON.stringify(JSON.parse(body), null, 2); } catch (error) { /* show raw */ }
        }
        out.textContent = pretty;
        preview.innerHTML = "";
        if (format === "html") {
          preview.innerHTML = body;
        } else {
          var text = format === "json" ? jsonToText(body) : body;
          text.split("\\n").forEach(function (line) {
            var p = document.createElement("p");
            p.textContent = line;
            preview.appendChild(p);
          });
        }
      })
      .catch(function () { out.textContent = "Request failed. Try again."; });
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
      format = button.dataset.format;
      buttons.forEach(function (other) {
        other.setAttribute("aria-pressed", String(other === button));
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

  [name, title, company].forEach(function (field) { field.addEventListener("input", schedule); });
  select.addEventListener("change", render);
  document.getElementById("shuffle").addEventListener("click", render);
  render();
})();
`;

function categoryCards(): string {
  return CATEGORY_SUMMARY.map(
    (category) => `
      <article class="card">
        <h4>${category.name}</h4>
        <div class="slug mono">/${category.slug}/:name</div>
        <p>${category.description}</p>
        <div class="sample">${category.example}</div>
      </article>`,
  ).join("");
}

function aliasRows(): string {
  return CATEGORY_SUMMARY.map(
    (category) => `
      <tr>
        <td><code>${category.slug}</code></td>
        <td>${category.templates} templates</td>
        <td>${category.aliases.map((alias) => `<code>${alias}</code>`).join(" ") || "&mdash;"}</td>
      </tr>`,
  ).join("");
}

export function renderHomepage(origin: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>SignaaS — Signature as a Service</title>
<meta name="description" content="A tiny REST API that returns stylized email sign-offs in JSON, plain text or HTML. 14 tones, one URL."/>
<meta property="og:title" content="SignaaS — Signature as a Service"/>
<meta property="og:description" content="GET /passive-aggressive/Alice. Stylized sign-offs as a service."/>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%E2%9C%8D%EF%B8%8F%3C/text%3E%3C/svg%3E"/>
<style>${CSS}</style>
</head>
<body>
<header class="top">
  <div class="wrap">
    <div class="brand">Signa<span>aS</span></div>
    <nav>
      <a href="#demo">Demo</a>
      <a href="#api">API</a>
      <a href="#categories">Categories</a>
      <a href="#limits">Limits</a>
    </nav>
  </div>
</header>

<main class="wrap">
  <div class="hero">
    <div class="pill">Signature as a Service</div>
    <h1>Sign off with the exact amount of energy the moment deserves.</h1>
    <p class="tagline">
      One GET request returns a stylized sign-off in JSON, plain text or HTML.
      Fourteen tones, from <em>Business</em> to <em>Existential Dread</em>. No key, no signup, no state.
    </p>
    <p class="tagline mono">curl ${origin}/pirate/Blackbeard</p>
  </div>

  <div class="demo" id="demo">
    <div class="fields">
      <div>
        <label for="category">Category</label>
        <select id="category"></select>
      </div>
      <div>
        <label for="name">Name</label>
        <input type="text" id="name" value="Ada" autocomplete="off" spellcheck="false"/>
      </div>
      <div>
        <label for="title">Title (optional)</label>
        <input type="text" id="title" placeholder="VP of Sales" autocomplete="off"/>
      </div>
      <div>
        <label for="company">Company (optional)</label>
        <input type="text" id="company" placeholder="Initech" autocomplete="off"/>
      </div>
    </div>

    <div class="formats">
      <button type="button" data-format="json" aria-pressed="true">JSON</button>
      <button type="button" data-format="text" aria-pressed="false">Plain text</button>
      <button type="button" data-format="html" aria-pressed="false">HTML</button>
      <button type="button" id="shuffle" aria-pressed="false">Shuffle</button>
    </div>

    <div class="request mono" id="request"></div>
    <div class="out-head">
      <strong>Response</strong>
      <button type="button" class="copy" id="copy">Copy</button>
    </div>
    <pre id="output">…</pre>
    <div class="preview" id="preview"></div>
  </div>

  <section id="api">
    <h2>API</h2>
    <p class="lede">
      Everything lives at one endpoint. The path picks the tone and the name; query
      strings add optional detail; the <code>Accept</code> header picks the format.
    </p>

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

    <h3>Query parameters</h3>
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

    <h3>Content negotiation</h3>
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
  </section>

  <section id="categories">
    <h2>Categories</h2>
    <p class="lede">Fourteen tones, each with a handful of templates picked at random per request.</p>
    <div class="cards">${categoryCards()}</div>

    <h3>Slugs and aliases</h3>
    <table>
      <thead><tr><th>Slug</th><th>Templates</th><th>Also accepts</th></tr></thead>
      <tbody>${aliasRows()}</tbody>
    </table>
  </section>

  <section id="limits">
    <h2>Rate limits</h2>
    <p class="lede">
      The free tier allows 100 requests per IP per hour. Responses carry
      <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code> and
      <code>X-RateLimit-Reset</code>; going over returns <code>429</code> with a
      <code>Retry-After</code> header. Paid keys travel in the
      <code>Authorization: Bearer &lt;key&gt;</code> header and skip the limit.
    </p>
    <p class="lede">CORS is wide open, so browser code can call the API directly.</p>
  </section>
</main>

<footer class="wrap">
  SignaaS · Signature as a Service · running on Cloudflare Workers.
</footer>

<script>${SCRIPT.replace("CATEGORY_DATA", () => jsonForScript(CATEGORY_SUMMARY))}</script>
</body>
</html>`;
}
