# Product direction

**Working codename: Leaf (singular).** Keep this as an internal development codename through the Chrome-extension phase. Public-facing names should plainly describe the reading tool; a public extension name has not been selected. Check name collisions and possible confusion with an official arXiv product before choosing one. No trademark clearance is claimed. The minimal reading interface remains unchanged. The personal site uses the research-portfolio repository; the shared reader will be separated in a later bounded step.

A quiet, fast, source-faithful scientific reader that works across papers and devices. This is an independent project; no arXiv partnership or official adoption is claimed.

## Principles

- Preserve scientific meaning, source versions, author attribution, figures, citations, and original mathematics. Unsupported input stays inspectable rather than silently rewritten.
- Make mobile reading comfortable without sacrificing desktop typography. Offer a small, accessible set of appearance choices.
- Keep rendering, import, and application features separate. Share a semantic document model and metadata across future clients, not client-specific DOM hacks.
- Start local-first: imported full text, search indexes, preferences, and future annotations stay on the reader's device by default. Import does not grant republication rights.
- Generalize from evidence. Add conservative rules and negative fixtures rather than branches keyed to a paper ID. Keep unavoidable historical adapters explicit.
- Deliver bounded increments. A direction is not a promised release date or authorization to launch a new app.

## Intended progression

The existing personal paper site is the proving ground. Next, test a minimal browser reading layer for existing arXiv HTML. A local-first library and web experience can follow once import and source identity are reliable. Native Mac, iOS, and Android clients and optional collaboration are later decisions, contingent on demonstrated need and stable shared foundations.

See [ROADMAP.md](ROADMAP.md) for gates and [STATUS.md](STATUS.md) for the current resume point. The maintainer's task tracker tracks individual work; these documents do not duplicate their status.

## Not current commitments

Arbitrary raw LaTeX compilation, a new mathematical typesetting engine, hosted copies of third-party papers, accounts/sync, a social network, and simultaneous native releases are not part of the current milestone. Raw LaTeX remains a possible future import adapter, not a capability of this build.
