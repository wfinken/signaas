# ✍️ SignaaS — Signatures as a Service

[![CI](https://github.com/wfinken/signaas/actions/workflows/ci.yml/badge.svg)](https://github.com/wfinken/signaas/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflareworkers&logoColor=white)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> **Life is too short for "Best regards" and "Hope this email finds you well" (it never does).**  
> **SignaaS** is a blisteringly fast, stateless micro-API that serves up stylized, contextual, and delightfully unhinged email sign-offs on demand.

---

## ⚡ TL;DR

Need a passive-aggressive sign-off for that email that definitely could have been a Slack message?

```console
$ curl https://signaas.cc/passive-aggressive/Alice
```

```json
{
  "message": "I trust you can figure it out from here.",
  "subtitle": "— Alice"
}
```

Or how about sealing a deal on the high seas?

```console
$ curl -H "Accept: text/plain" https://signaas.cc/pirate/Blackbeard
```

```text
May yer anchor be tight and yer compass true.
— Cap'n Blackbeard
```

---

## 🧐 What is SignaaS?

Ever stared blankly at an email draft wondering how to close without sounding like an automated insurance bot? **SignaaS (Signatures as a Service)** fixes that.

- ⚡ **Edge-Native**: Runs on **Cloudflare Workers** with zero cold starts and global low-latency responses.
- 🎭 **28+ Curated Tones**: From `existential-dread` and `pirate` to `passive-aggressive`, `noir`, `haiku`, and corporate `business`.
- 🔄 **Content Negotiation**: Delivers formatted `application/json`, `text/plain`, or email-ready `text/html`.
- 🎲 **Deterministic Seeding**: Pin templates with `?seed=foo` for predictable, edge-cached outputs.
- 🛡️ **Zero Injection Risk**: Strict input normalization and HTML escaping keep your email signatures clean and safe.
- 🧩 **Zero-Config Setup**: Works out of the box with zero external dependencies, plus optional KV rate-limiting and D1 tallying.

---

## 🚀 Quickstart & API Reference

Base URL: `https://signaas.cc` (or `http://localhost:8787` locally)

### 📍 Core Endpoints

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/:category/:name` | `GET` | Generate a stylized signature for `:name` in `:category` |
| `/random/:name` | `GET` | Russian roulette of sign-offs across all available tones |
| `/categories` | `GET` | JSON catalogue of all 28+ tones, aliases, and template counts |
| `/openapi.json` | `GET` | Full OpenAPI 3.1 schema specification |
| `/health` | `GET` | Liveness probe & total count of signatures served |
| `/` | `GET` | Interactive browser console & docs (or JSON index via `Accept: application/json`) |

---

### 🎛️ Query Parameters

Tune your sign-off to perfection with query parameters:

| Parameter | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `title` | `string` | Appends a job title to the signer attribution | `?title=VP%20of%20Overthinking` |
| `company` | `string` | Appends company or organization name | `?company=Acme%20Corp` |
| `recipient` / `to` | `string` | Target recipient for templates that address someone directly | `?recipient=Dave` |
| `format` | `string` | Output format: `json`, `text`, or `html` (overrides `Accept` header) | `?format=html` |
| `seed` | `string` | Deterministic template selector (cached at edge for 24h) | `?seed=ticket-4091` |

---

### 🎨 Content Negotiation & Formats

SignaaS speaks whatever language your application prefers. Use standard HTTP `Accept` headers or pass `?format=`:

#### 1. JSON (Default)
```console
$ curl "https://signaas.cc/business/John?title=VP%20of%20Synergy&company=Initech"
```
```json
{
  "message": "Let's circle back and operationalize this paradigm.",
  "subtitle": "— John, VP of Synergy, Initech"
}
```

#### 2. Plain Text (`Accept: text/plain` or `?format=text`)
```console
$ curl -H "Accept: text/plain" "https://signaas.cc/noir/Spade?recipient=Client"
```
```text
Watch your back in the rain, Client.
— Spade
```

#### 3. HTML (`Accept: text/html` or `?format=html`)
```console
$ curl -H "Accept: text/html" "https://signaas.cc/victorian/Evelyn?title=Duchess"
```
```html
<p>I remain, as ever, your most humble and obedient servant,</p>
<p><strong>Evelyn</strong><br/><em>Duchess</em></p>
```

---

## 🎭 Tone Catalog

SignaaS ships with 28+ tones (and friendly aliases). A taste of what's inside:

| Tone | Aliases | Sample Sign-Off |
| :--- | :--- | :--- |
| 😒 **`passive-aggressive`** | `pa` | *"Per my previous email that you evidently skimmed,"* |
| 🏴‍☠️ **`pirate`** | `arr`, `buccaneer` | *"Fair winds, and keep a weather eye on the horizon,"* |
| 🕶️ **`noir`** | `gumshoe`, `detective` | *"The city never sleeps, and neither do the mistakes,"* |
| ☕ **`tired`** | `exhausted`, `sleepy` | *"Sent from my bed at an unreasonable hour,"* |
| 🦹 **`villain`** | `evil`, `nemesis` | *"Until our inevitable final clash,"* |
| 🌌 **`existential-dread`** | `void`, `nihilism` | *"Into the howling silence of an uncaring cosmos,"* |
| 🚀 **`sci-fi`** | `robot`, `cyber` | *"May your subroutines execute without interrupt,"* |
| 📜 **`shakespearean`** | `bard` | *"Fare thee well, and let fortune guide thy quill,"* |
| 🧢 **`gen-z`** | `zoomer` | *"no cap fr fr,"* |
| 🍶 **`haiku`** | — | *"Inbox reaches zero / Brief peace descends on my soul / New message arrives,"* |

Fetch the live, complete catalog anytime:
```console
$ curl https://signaas.cc/categories
```

---

## 💻 Running Locally

Running SignaaS locally is quick and painless.

### 📋 Prerequisites

- **Node.js**: v22+ (managed via `.nvmrc` or `.node-version`)
- **npm**: v10+

### 🛠️ Setup & Dev Server

```bash
# 1. Clone the repository
git clone https://github.com/wfinken/signaas.git
cd signaas

# 2. Install dependencies (automatically builds the template corpus)
npm install

# 3. Start local development server on http://localhost:8787
npm run dev
```

Test it in your terminal:
```console
$ curl http://localhost:8787/cowboy/Woody
```

---

## 🧪 Testing & Quality Checks

SignaaS is backed by an automated test suite verifying corpus integrity, text sanitization, rate limits, and endpoint routing:

```bash
# Run Vitest test suite
npm test

# Run TypeScript type check
npm run typecheck

# Run both in one step
npm run check

# Rebuild and validate the corpus independently
npm run corpus
```

---

## ✍️ Adding New Tones & Lines

The entire template corpus is stored as plain text files in [`categories/`](categories). Adding a new tone—or contributing a witty sign-off—requires **zero TypeScript changes**:

1. Create or edit `categories/<tone-name>.txt`:
   ```text
   Vampire
   description: Midnight musings from the creature of the night.
   aliases: dracula, nosferatu
   signer: Count {name}

   Until the moon wanes,
   Yours in eternal darkness,
   Watch your neck, | {name}, Creature of the Night
   ```
2. Run `npm run corpus` (validates duplicates, formatting, and compiles to TypeScript).
3. Open a Pull Request! See [CONTRIBUTING.md](CONTRIBUTING.md) for full formatting details.

---

## 🛡️ Security & Input Sanitization

SignaaS takes email safety seriously:
- **Character Sanitization**: Path segments and query parameters are stripped of control codes, zero-width spaces, and bidirectional overrides.
- **Length Caps**: Inputs are bounded to 64 characters to prevent template blowout.
- **HTML Escaping**: All dynamic variables in HTML responses escape `&`, `<`, `>`, `"`, and `'` to eliminate email client injection vectors.
- **HTTP Methods**: Only `GET`, `HEAD`, and `OPTIONS` are supported; everything else returns `405 Method Not Allowed`.

---

## ⚙️ Cloudflare Bindings (Optional)

SignaaS works out of the box with zero configuration. For production scale, you can optionally enable KV and D1 bindings:

- **Rate Limiting (KV)**: Bound as `RATE_LIMIT_KV` in `wrangler.jsonc` to enforce free-tier hourly limits (100 req/hr/IP). API keys set via `API_KEYS` secret bypass this.
  ```bash
  npx wrangler kv namespace create RATE_LIMIT_KV
  ```
- **Live Counter (D1)**: Bound as `DB` in `wrangler.jsonc` to track total signatures served on the homepage and `/health`.
  ```bash
  npx wrangler d1 create signaas
  ```

---

## 🚢 Deployment

Deploy to your own Cloudflare Workers domain in seconds:

```bash
npm run deploy
```

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
