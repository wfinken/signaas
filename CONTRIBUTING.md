# Contributing to SignaaS

The interesting part of this project is the writing. Almost every contribution
is one text file in [`categories/`](categories), and you can make it without
cloning anything.

## Add a sign-off to a tone you like

1. Open the file for that tone — [`categories/`](categories) lists them all, and
   the file name matches the URL: `/pirate/Ada` lives in `categories/pirate.txt`.
2. Press the pencil icon on GitHub and add your line at the bottom.
3. Commit to a new branch and open the pull request.

That is the whole process. One good line is a perfectly good pull request.

## Add a whole new tone

Create `categories/your-tone.txt`, using GitHub's **Add file → Create new
file** if you like:

```
Sea Shanty
description: For correspondence that deserves a work song.
aliases: shanty, whaling

Soon may the reply-guy come,
Haul away, and mind the deadline,
There once was a ship that put to sea, and then it sent this email,
```

The first line is the name, `description:` is required, and everything under the
blank line is one sign-off per line.
[`categories/README.md`](categories/README.md) covers the rest — aliases, how to
change the way the name is signed, and the `{name}` / `{title}` / `{company}` /
`{recipient}` placeholders.

Aim for a dozen or so lines so the tone does not repeat itself in one thread,
and keep it distinct from the tones already there: `villain` is theatrical where
`mad` is genuinely angry, `tired` is burnt out where `existential-dread` is
cosmic.

Nothing else needs touching. The homepage, `/categories`, the OpenAPI document
and the counts in the docs all read from the corpus, so they pick up your file
on their own.

## If you want to run it locally

```console
$ npm install
$ npm run corpus     # reads categories/*.txt and reports any problem
$ npm test           # the corpus checks plus the API tests
$ npm run dev        # http://localhost:8787
```

`npm run corpus` is the one to know. It names the file and line for anything it
cannot read:

```console
$ npm run corpus

  categories/sea-shanty.txt:2 sets "descriptoin", which is not a setting. Use description, aliases, signer.

  See categories/README.md for the format.
```

CI runs the same checks on your pull request, so it is fine to let it do the
work if you are editing in the browser.

## Changing the code

Bug fixes and improvements to the API or the homepage are welcome too. The
layout of the source is in the [README](README.md#development). Two things to
know:

- `src/corpus.generated.ts` is built from the text files and is not in the
  repository. It appears when you run `npm install`, `npm test` or
  `npm run corpus`. Do not edit it; edit the text files.
- Please run `npm run check` (typecheck and tests) before opening a pull
  request.

## Ground rules for the writing

Sign-offs are read by strangers in their own inbox. Keep them the kind of thing
you would be happy to receive: sharp is good, cruel is not. No slurs, no
harassment, nothing targeting a real person or organisation, and nothing that
would embarrass someone who pasted it into a work email without reading it
twice.
