# SignaaS — Signature as a Service

A tiny, stateless REST API that returns stylized sign-offs. Pass a tone and a
name in the URL, get back a signature in JSON, plain text, or HTML.

```console
$ curl https://signaas.cc/passive-aggressive/Alice
{
  "message": "I trust you can figure it out from here.",
  "subtitle": "— Alice"
}
```

Runs on Cloudflare Workers: no database, no cold starts, no state to keep warm.
The homepage doubles as the documentation and ships an interactive console.

Every tone is a plain text file in [`categories/`](categories), so adding one —
or adding a single good sign-off to one that exists — is a text edit you can
make in the browser. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Endpoints

| Endpoint | Returns |
| --- | --- |
| `GET /:category/:name` | A signature in the negotiated format |
| `GET /random/:name` | A signature from a randomly chosen category |
| `GET /categories` | JSON catalogue of categories, aliases and template counts |
| `GET /openapi.json` | OpenAPI 3.1 description of the service |
| `GET /health` | Liveness probe |
| `GET /` | Homepage and docs (HTML), or a JSON service index for API clients |

### Query parameters

| Parameter | Effect |
| --- | --- |
| `title` | Appended to the attribution; italicised on its own line in HTML |
| `company` | Appended after the title |
| `recipient` (or `to`) | Available to templates that address someone directly |
| `format` | `json`, `text` or `html`; overrides the `Accept` header |
| `seed` | Pins the template choice, so the same seed always returns the same line |

### Content negotiation

The `Accept` header selects the representation; `application/json` is the
default when nothing matches. Seeded responses are cacheable
(`public, max-age=86400`); unseeded ones are `no-store`, since they are random.

```console
$ curl -H 'Accept: text/plain' https://signaas.cc/pirate/Blackbeard
May yer anchor be tight and yer compass true.
— Cap'n Blackbeard

$ curl -H 'Accept: text/html' 'https://signaas.cc/business/John?title=VP%20of%20Sales'
<p>Yours in synergy,</p>
<p><strong>John</strong><br/><em>VP of Sales</em></p>
```

## Categories

Every tone is a text file in [`categories/`](categories): the file name is the
URL, the first line is the display name, and the rest of the file is one
sign-off per line.

```
Pirate
description: Swashbuckling sign-offs for the seven seas.
aliases: pirates, arr, buccaneer
signer: Cap'n {name}

Fair winds and following seas,
Reply swift, or walk the plank.
```

Each tone has a handful of aliases (`robot` → `sci-fi`, `genz` → `gen-z`, `pa` →
`passive-aggressive`, `gumshoe` → `noir`, …) and a dozen or more sign-offs, one
picked at random per request. `GET /categories` returns the authoritative list.

Adding a tone or a line is a text edit, and needs no other change:
[CONTRIBUTING.md](CONTRIBUTING.md) has the two-minute version and
[`categories/README.md`](categories/README.md) has the full format.

## Rate limiting

The free tier allows 100 requests per IP per hour, reported through
`X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset`. Exceeding
it returns `429` with `Retry-After`. Paid-tier keys travel in
`Authorization: Bearer <key>` and skip the limit entirely.

Counting is backed by KV, and is **off until a KV namespace is bound**, so a
first deploy works with no setup. To turn it on:

```console
$ npx wrangler kv namespace create RATE_LIMIT_KV
```

then uncomment the `kv_namespaces` block in `wrangler.jsonc` and paste the id.
Set the paid keys as a secret (comma separated):

```console
$ npx wrangler secret put API_KEYS
```

Adjust the allowance with the `RATE_LIMIT` var in `wrangler.jsonc`.

## Signatures served

The homepage hero carries a running tally — *12,345 signatures served* — and
`GET /health` reports the same number as `served`. Every successful signature
response adds one; documentation, catalogue and health requests do not count.

The tally lives in a D1 database and is **off until one is bound**, so a first
deploy works with no setup: the API serves every request, the homepage leaves
the line out, and `/health` reports `"served": null`. To turn it on:

```console
$ npx wrangler d1 create signaas
```

then uncomment the `d1_databases` block in `wrangler.jsonc` and paste the id.
The Worker creates its one table on first use, so there is no migration to
run; `migrations/0001_counters.sql` holds the same schema for anyone who would
rather apply it explicitly. The increment runs after each response has left,
and a failure to count is logged and never surfaces to a caller.

## Security

`:name` and every query parameter are normalised, stripped of control,
zero-width and bidi-override characters, collapsed to single spaces, and capped
at 64 characters before they reach a template. HTML output escapes `& < > " '`,
so a name can never inject markup into an email signature. CORS is open on
every endpoint; only `GET`, `HEAD` and `OPTIONS` are accepted.

## Development

```console
$ npm install
$ npm run dev        # wrangler dev on http://localhost:8787
$ npm test           # vitest
$ npm run typecheck  # tsc --noEmit
$ npm run check      # both
```

### The corpus

The corpus is not in the TypeScript. `scripts/build-corpus.mjs` reads
`categories/*.txt` and writes `src/corpus.generated.ts`, which is gitignored and
rebuilt automatically before `dev`, `test`, `typecheck`, `deploy` and on
`npm install` — so a contributor adds a text file and nothing else. Run it on
its own with `npm run corpus`; it reports the first problem it finds with the
file and line number.

Tests hold the corpus to its shape: one lookup key per tone, no sign-off
repeated anywhere, the haiku form, and that the bundled corpus matches the files
on disk.

### Homepage design

The homepage is a single rendered string in `src/home.ts`. It aims to read as a
quiet, well-made tool — cleanly engineered, and subtly welcoming with it:

- **Two typefaces.** DM Sans sets headings and interface text; a rounded
  monospace (Cascadia Code or SF Mono where they are installed, Fira Code
  otherwise) sets anything a developer would copy. Order comes from weight and a
  muted text colour, not from shouting.
- **Warm, muted colour.** Paper is a warm off-white `#fdfcfb`, ink a soft
  charcoal `#2c2a28`, and dark mode a soft deep slate `#1c1c1e`. Borders are
  semi-transparent, so they suggest structure rather than draw it.
- **One accent, plus two signals.** A soft terracotta `#9d5b3f` marks primary
  actions and the API's own nouns; sage marks healthy state, clay marks a
  failure. Every one of them is deepened until it clears 4.5:1 on its
  background — muted is not the same as unreadable.
- **Softened geometry.** 6px corners, generous padding, and shadows diffused to
  3% opacity that only separate layers. The grid is still the frame, drawn
  gently.
- **Quietly helpful motion.** 150ms ease-in-out on hover and focus; hover fades
  rather than inverts. A request in flight glides a slim accent bar and pulses
  skeleton lines the shape of the answer, instead of a spinner.

Tests in `test/api.test.ts` assert the parts that are easy to undo by accident:
the two families, the accent value, no gradients, no corner rounder than 6px,
no shadow above 25% opacity, and the 150ms easing.

```
categories/      the corpus: one text file per tone, and its format guide
scripts/
  build-corpus.mjs  reads categories/*.txt into src/corpus.generated.ts
src/
  index.ts       routing, CORS, error shapes, HEAD/OPTIONS handling
  categories.ts  corpus types, slug/alias lookup
  signature.ts   template selection, substitution, JSON/text/HTML rendering
  sanitize.ts    input cleaning and HTML escaping
  negotiate.ts   Accept header parsing and ?format override
  ratelimit.ts   KV-backed fixed window counter, API key bypass
  home.ts        the homepage, generated from the corpus
  openapi.ts     OpenAPI 3.1 document, generated from the corpus
```

## Deployment

Cloudflare Workers, configured in `wrangler.jsonc`. Connecting the repository
to a Cloudflare Workers Build deploys every push to `main` automatically:

- Build command: `npm install` (the Worker is TypeScript, bundled at deploy time;
  the install also builds the corpus out of `categories/*.txt`)
- Deploy command: `npm run deploy`
- Node.js version: Specified via `.nvmrc` and `.node-version` (Node 20) for fast build environment initialization.

Manual deploys use the same command:

```console
$ npm run deploy
```

`npm run deploy` rebuilds the corpus and then runs `wrangler deploy`. Bare
`npx wrangler deploy` works too, as long as `npm install` has run in the
checkout at some point.

The production domain `signaas.cc` (and `www.signaas.cc`) is already declared
in `wrangler.jsonc` as a custom domain. Both entries need `signaas.cc` to be an
active zone on the same Cloudflare account: add it under **Websites** in the
dashboard, or point the registrar's nameservers at Cloudflare. Wrangler creates
the DNS records itself on deploy; a deploy that fails with *could not find
zone* means the domain has not been added to the account yet.

The canonical origin the site advertises (`<link rel="canonical">`, `og:url`,
the OpenAPI `servers` list) comes from the `PUBLIC_ORIGIN` var in
`wrangler.jsonc`, so a fork or a preview deploy can advertise its own address.
Documentation examples always use the origin the request arrived on, so a curl
line copied from `localhost:8787` keeps working.

## License

MIT — see [LICENSE](LICENSE).
