# 🎭 Corpus Guide — SignaaS Tones & Sign-offs

> **The heart and soul of SignaaS lies in its tone corpus.**  
> Every tone is defined as a plain-text file in this directory. Adding a new personality or contributing a witty sign-off requires **zero TypeScript changes**—the build system automatically compiles and validates everything into an edge-ready dataset.

---

## ⚡ Quick Overview

SignaaS routes requests directly to plain text files located in `categories/`:

- **File Name ➔ Route**: The file slug directly determines the API endpoint path. For instance, `categories/pirate.txt` serves requests to `GET /pirate/:name`.
- **Zero Config**: Drop a new `.txt` file into `categories/` and it is immediately discovered, indexed in `/categories`, documented in OpenAPI specifications, and rendered on the web frontend.
- **Edge Compilation**: Cloudflare Workers do not have access to a local filesystem at runtime; running `npm run corpus` converts all `.txt` files into an optimized TypeScript module (`src/corpus.generated.ts`).

---

## 📂 File Architecture & Naming

Every tone lives in its own text file using the format `<tone-slug>.txt`:

- **Slug Convention**: File names must be lowercase letters, digits, and hyphens (e.g., `passive-aggressive.txt`, `sci-fi.txt`, `existential-dread.txt`).
- **Path Resolution**: The slug matches the primary endpoint segment:
  ```console
  categories/vampire.txt  ➔  GET https://signaas.cc/vampire/:name
  ```

---

## 📝 Tone File Anatomy

A category file consists of two sections: a **header block** with metadata settings, followed by a blank line and a **template block** with one sign-off per line:

```text
Pirate
description: Swashbuckling sign-offs for the seven seas.
aliases: arr, buccaneer, sea-dog
signer: Cap'n {name}

Fair winds and following seas,
Reply swift, or walk the plank.
Yo ho, and mind the kraken.
May yer rum be strong and yer compass true,
Until we meet at Davy Jones' locker, | Cap'n {name}, Scourge of the Seven Seas
```

---

### 🏷️ Header Directives

The first line and key-value directives define the category's behavior:

| Directive | Required? | Description | Example |
| :--- | :---: | :--- | :--- |
| **Line 1 (Name)** | **Yes** | The human-friendly display name used in API listings and web UI | `Pirate` |
| **`description:`** | **Yes** | A concise one-line summary returned by `/categories` and shown in the UI | `description: Swashbuckling sign-offs for the seven seas.` |
| **`aliases:`** | No | Comma-separated alternative route slugs that resolve to this tone | `aliases: arr, buccaneer` (allows `GET /arr/Ada`) |
| **`signer:`** | No | Global override for how the signer attribution is formatted in this file | `signer: Cap'n {name}` or `signer: {name}, Space Cadet` |

> [!NOTE]
> A single blank line marks the end of the header directives. Lines starting with `#` are treated as comments, and empty lines within the sign-offs section are ignored.

---

### ✍️ Template Sign-offs & Custom Signers

Every non-empty line below the header is a distinct sign-off message.

#### 1. Standard Sign-off
By default, the message inherits the file-level `signer` directive (or defaults to the user's name if unspecified):
```text
Fair winds and following seas,
```
Output:
```text
Fair winds and following seas,
— Cap'n Ada
```

#### 2. Per-Line Custom Signer (`|` separator)
Use a pipe (`|`) to customize the signer attribution specifically for that line:
```text
Until we meet at Davy Jones' locker, | Cap'n {name}, Scourge of the Seven Seas
```
Output:
```text
Until we meet at Davy Jones' locker,
— Cap'n Ada, Scourge of the Seven Seas
```

---

### 🧩 Available Placeholders

You can use dynamic placeholders anywhere inside a sign-off template or a signer string. Any parameter not provided by the caller is stripped cleanly without leaving orphan spaces or dangling punctuation:

| Placeholder | Source | Description | Example |
| :--- | :--- | :--- | :--- |
| `{name}` | `:name` (URL path) | The primary signer name specified in the route | `Alice` |
| `{title}` | `?title=` (query param) | Job title or role of the sender | `VP of Overthinking` |
| `{company}` | `?company=` (query param) | Organization or company name | `Acme Corp` |
| `{recipient}` | `?recipient=` or `?to=` | Name of the intended recipient | `Dave` |

---

## 📏 House Rules & Writing Standards

To maintain corpus quality and consistency across all tones:

- 🔒 **Globally Unique Sign-offs**: Every sign-off message must be unique across the **entire** corpus. The build script will fail if any template is duplicated across files.
- 🎯 **Distinct Voice & Tone**: Keep each tone immediately recognizable from a single line. If a sign-off feels ambiguous, refine it to sharpen its identity (e.g., theatrical `villain` vs. genuinely angry `mad`, cosmic `existential-dread` vs. burnt-out `tired`).
- 📚 **Depth & Variety**: New tone files should aim for **10–15+ sign-offs** to avoid repetitive results in ongoing email threads. Contributing single witty lines to existing tones is always welcome.
- 🛡️ **Inbox Etiquette**: Sign-offs should be witty, funny, or sharp—never genuinely abusive or cruel. Avoid real-world personal attacks, protected-class slurs, or harassment. Keep it workplace-humorous.
- 🔤 **Slug Rules**: Slugs must contain only lowercase letters, digits, and hyphens (matches `^[a-z0-9]+(?:-[a-z0-9]+)*$`).

---

## 🧪 Validating & Testing Your Work

The build system includes automatic linting and validation for all corpus files:

```bash
# Validate headers, placeholders, and duplicate lines
npm run corpus
```

When everything passes cleanly, the compiler reports the live tally:
```console
$ npm run corpus
corpus: 29 tones, 505 templates
```

If an error is encountered, the tool reports the exact file and line number:
```console
categories/sea-shanty.txt:2 sets "descriptoin", which is not a setting. Use description, aliases, signer.
```

Run the complete test suite to verify both corpus integrity and API endpoints:
```bash
# Run full test suite & TypeScript typecheck
npm run check
```

---

## 🔗 Related Resources

- [Main Repository README](../README.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [OpenAPI Specification](https://signaas.cc/openapi.json)

