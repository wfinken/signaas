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

Twenty-eight tones, 485 templates.

`normal`, `business`, `funny`, `mad`, `passive-aggressive`,
`overly-enthusiastic`, `gen-z`, `cryptic`, `shakespearean`,
`existential-dread`, `sci-fi`, `apocalyptic`, `pirate`, `needy`, `noir`,
`cowboy`, `legalese`, `academic`, `founder`, `zen`, `haiku`, `coach`,
`conspiracy`, `victorian`, `bureaucratic`, `infomercial`, `villain`, `tired`.

Each has aliases (`robot` → `sci-fi`, `genz` → `gen-z`, `pa` →
`passive-aggressive`, `gumshoe` → `noir`, …) and seventeen or eighteen
templates, one picked at random per request. `GET /categories` returns the
authoritative list.

Two tones carry a rule of their own: every `haiku` line is five syllables,
seven, then five, written as three parts separated by ` / `; every
`overly-enthusiastic` line shouts.

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

### Homepage design

The homepage is a single rendered string in `src/home.ts`, and it follows a few
rules on purpose:

- **Two typefaces.** Space Grotesk sets every heading; JetBrains Mono sets
  everything else, body copy included. Hierarchy comes from size and weight, not
  from stacking bold, italic and colour on the same run of text.
- **Two backgrounds.** Off-white `#f9f9f9` and true black `#050505`, chosen by
  `prefers-color-scheme`. Nothing muddy in between.
- **One accent.** Construction orange `#ff4a00`, spent only on the primary
  action, live state, focus rings and failures. Once it starts decorating, it
  has stopped meaning anything.
- **Hard 1px rules, square corners, no shadows.** The grid is the ornament:
  cells sit on a hairline background with a 1px gap, so the structure shows.
- **No transitions.** Hover is a colour inversion that lands on the same frame
  as the pointer. In-flight requests draw a 1px line sweeping the console and a
  blinking block cursor, never a spinner.

Tests in `test/api.test.ts` assert the parts that are easy to undo by accident:
the two families, the accent value, and the absence of rounded corners,
shadows and gradients.

Adding a tone means adding an entry to `CATEGORIES` in `src/categories.ts`; the
homepage, `/categories`, the OpenAPI document and the tests all read from that
one array. Tests in `test/api.test.ts` hold the corpus to its shape: the tone
and template totals, a lookup key no two tones share, and no sign-off repeated
in any tone. A template is a `message` plus an optional `signer` (how the name is
written, e.g. `"Cap'n {name}"`); both support the `{name}`, `{title}`,
`{company}` and `{recipient}` placeholders.

```
src/
  index.ts       routing, CORS, error shapes, HEAD/OPTIONS handling
  categories.ts  the corpus: 28 categories and their 485 templates
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

- Build command: `npm install` (the Worker is TypeScript, bundled at deploy time)
- Deploy command: `npx wrangler deploy`

Manual deploys use the same command:

```console
$ npx wrangler deploy
```

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

## Roadmap

Custom stored templates via authenticated `POST`, localized signatures
(`/funny/es/Juan`), and browser extensions for Gmail and Outlook.

## License

MIT — see [LICENSE](LICENSE).
