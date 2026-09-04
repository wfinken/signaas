# The corpus

One file per tone. The file name is the URL, so `pirate.txt` answers
`GET /pirate/:name`.

```
Pirate
description: Swashbuckling sign-offs for the seven seas.
aliases: pirates, arr, buccaneer
signer: Cap'n {name}

Fair winds and following seas,
Reply swift, or walk the plank.
Yo ho, and mind the kraken.
```

- **First line** is the tone's display name.
- **`description:`** is one line, shown on the homepage and returned by
  `/categories`. Required.
- **`aliases:`** are other spellings that should reach this tone, comma
  separated. Optional. `/robot/Ada` works because `sci-fi.txt` lists it.
- **`signer:`** changes how the name is written for every sign-off in the file.
  Optional; the default is just the name.
- **A blank line** ends the settings. Everything below is one sign-off per line.
- **`#`** at the start of a line is a comment. Blank lines are ignored.

## Sign-offs

A line is the sign-off exactly as it will be sent:

```
Best regards,
```

Add `| something` to change how the name is signed on that line alone:

```
See you on the other side of it, | Survivor {name}
```

Four placeholders are available anywhere in a sign-off or a signer, and any that
the caller leaves empty is dropped cleanly:

| Placeholder | Filled with |
| --- | --- |
| `{name}` | the `:name` in the URL |
| `{title}` | `?title=` |
| `{company}` | `?company=` |
| `{recipient}` | `?recipient=` or `?to=` |

## House rules

- Every sign-off appears once, across the whole corpus. The build fails on a
  repeat and tells you which file already has it.
- Keep a tone recognisable from a single line. If a sign-off would fit just as
  well in another file, it probably belongs there.
- Aim for a dozen or more sign-offs in a new tone, so it does not repeat itself
  in a single thread. One good line is still welcome in an existing file.
- File names are lowercase letters, digits and dashes.

## Checking your work

```console
$ npm run corpus
corpus: 28 tones, 485 templates
```

That reads every file and reports the first problem with the file and line
number. `npm test` runs it too, so a green test run means the corpus is sound.
