# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

The Drift Meter — Experiment 01 of the Agential Drift Research Program. A published
research artifact: three hand-written essay pages, one interactive instrument, and one
serverless endpoint that calls Claude. Sole author: Megi Pishtari.

It is a static site. There is no package manager, no build step, no test suite, no CI,
and no config files. Do not add any of these unless asked — their absence is deliberate,
and the whole site is meant to be readable by opening a file.

## Files

| Path | What it is |
|---|---|
| `index.html` | Landing page. Hand-authored, fully self-contained. |
| `essay.html` | "Evaluating the Evaluator" — short companion essay. Hand-authored. |
| `atrophy.html` | "The Atrophy of Judgment" — the long essay. Hand-authored. |
| `drift-meter.html` | **Generated bundle. Do not edit by hand.** See below. |
| `api/reflect.js` | Vercel serverless function holding the Anthropic API key. |
| `CHANGELOG.md` | Versioned record of what changed and why. Retractions stay in. |
| `SOURCES.md` | Every external claim, its source, and its clearance status. |
| `SETUP-live-claude.md` | How to deploy the endpoint and point the page at it. |

## Hard rules

**1. Never hand-edit `drift-meter.html`.**
It is a ~890 KB bundler output: a gzipped, base64-encoded React app inside a loader shell,
plus inlined fonts. The real source is a separate file, `Drift Meter.dc.html`, which is
**not in this repository** (see `SETUP-live-claude.md`). To change the instrument, edit that
source, re-bundle, and replace `drift-meter.html` wholesale. Any attempt to patch the bundle
in place — including a "small" string edit — corrupts it. If asked to change the instrument's
behavior, say the source is not present rather than editing the artifact.

**2. The API key never touches the browser.**
`api/reflect.js` reads `process.env.ANTHROPIC_API_KEY` server-side. Do not introduce a code
path that puts a key, or anything derived from one, into an HTML file or client-side JS.

**3. `MODEL` in `api/reflect.js` is pinned on purpose.**
`claude-sonnet-4-5-20250929` — an exact ID, not an alias. The instrument contains a model, so
results are comparable only within a pinned version. Do not "upgrade" it as routine
maintenance; a model change is a re-baseline and belongs in `CHANGELOG.md` as such. The ID the
API returns is printed in the UI alongside every response, and that should stay true.

**4. The endpoint takes a question index, never free text.**
`TEACH_QUESTIONS` is the complete set of questions this endpoint will answer; the client sends
`questionId`. `sanitizeReflect` rebuilds the reflect payload from a known key list, coercing
every value to a bounded number or a fixed label. Both exist so the function is not an open
proxy to the API key — the origin check alone does not stop a forged header. Preserve this
shape. The same goes for the rate limits, `MAX_BODY_BYTES`, and `ALLOWED_ORIGINS`.

**5. Factual changes carry paperwork.**
This project's argument is about unearned confidence, so its own claims are tracked. If a
change touches an external claim, a figure, or a source, update `SOURCES.md` in the same pass
(rows are `FLAGGED` / `SECONDARY` / `PRIMARY AVAILABLE` / `PRIMARY` / `CORRECTED`). If it
changes what the site asserts or removes something previously published, add a
`CHANGELOG.md` entry with **What changed** and **Why**. Errors get recorded, not deleted.

**6. Do not invent numbers.**
No illustrative-but-unlabeled figures, no cohort data, no placeholder statistics. A prior
version shipped an invented cohort dashboard and it was retracted (v0.2). Anything
illustrative must say so on the page.

## Running and deploying

- **Locally:** open the `.html` files in a browser. Nothing to install or serve.
  The live-Claude features need the deployed function; without it the page degrades to a
  static "available on request" state.
- **Deploy:** Vercel serves both the static pages and `api/reflect.js` from
  `https://drift-meter.vercel.app` — that is the endpoint URL compiled into the bundle and the
  first entry in `ALLOWED_ORIGINS`. `ANTHROPIC_API_KEY` lives as a Vercel project environment
  variable, never in the repo. A GitHub Pages copy is also referenced
  (`mp7770.github.io/drift-meter/`). Pushing to `main` is the publish step — treat every push
  as going live.
- **Cost:** the in-memory rate limiters in `reflect.js` are best-effort only; serverless
  instances are short-lived and parallel. The console spend cap is the real guarantee.

## Conventions for the hand-authored pages

Each of `index.html`, `essay.html`, `atrophy.html` is standalone: one inline `<style>` block,
no shared stylesheet, no JS, fonts from Google Fonts. Keep that. Do not factor out a shared
CSS file or add a framework.

Shared design tokens, already consistent across the three pages:

- Background `#F0EEE6`, ink `#141413`/`#1A1916`, green `#2E5E4F` (hover `#234B3E`),
  muted mono `#A39A88`, rules `#DCD7C9`.
- Newsreader (serif) for headings and essay body; IBM Plex Sans for UI copy; IBM Plex Mono
  for kickers, eyebrows, captions, and footers.
- Measure capped around 40ch for essay text, 54ch for body copy; justified with hyphenation.

**Voice.** Plain, unhurried, understated. No hype, no flattery, no exclamation points, no
marketing register. The writing states its own limits rather than hiding them ("It is a
trace, not a finding"). Match this in any prose added to the site — including microcopy.

## Working practice

Commits on `main` are mostly "Add files via upload", i.e. files pushed through the GitHub web
interface rather than committed locally. Expect the working tree and `origin/main` to diverge
in both directions; check `git status` and fetch before assuming local state is current.
