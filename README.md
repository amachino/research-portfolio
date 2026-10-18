# Research portfolio

Personal research site: [published portfolio](https://amachino.github.io/research-portfolio/). The shared reader is planned as a separate project; extraction and its public name are not yet decided.

Start/resume work: [STATUS](STATUS.md). Product direction: [PRODUCT](PRODUCT.md), [ROADMAP](ROADMAP.md), [ARCHITECTURE](ARCHITECTURE.md). Individual tasks and progress live in the maintainer's task tracker; draft PRs review code changes.

Two responsive reading editions of quantum computing papers, with JavaScript KaTeX run **at build time**. The public site contains only an index and the recommended reader for each paper:

- `docs/index.html`
- `docs/bswap.html`
- `docs/qubex.html`

No client-side math renderer, analytics, CDN, or runtime service is required. Appearance settings offer STIX serif or the system sans-serif font, exactly three responsive text sizes (Small/Medium/Large), and Light/Dark themes. On phones the sizes are 14.5/17/20 px with line heights 1.25/1.45/1.55; desktop sizes are 19/22/25 px (Small is 18 px on intermediate screens). Native radio controls sit in a modal dialog presented as a phone bottom sheet. Original scientific figure colors are preserved on white panels. Valid earlier numeric preferences migrate to the closest preset. Preferences are shared across both papers using only localStorage in the same browser; Reset restores Small, Serif, and Light defaults. Browser zoom remains enabled. The math fonts are unchanged, with inline math inheriting the surrounding text size. No preference is transmitted.

The small `anchor.js` helper corrects initial fragment positioning after local fonts load without interrupting a reader who has interacted with the page. Prose is justified with automatic English hyphenation. At widths of 600 px and below, text uses 14.5 px STIX Two Text and a 1.25 line-height; at 350 px and below it is start-aligned. Citation labels remain upright, figures have intrinsic dimensions, and wide equation/table overflow stays local.

## Rebuild and test

Use Node.js 24.19.0 and npm 11.9.0 (the tested reference versions, recorded in `.nvmrc` and `package.json`; dependencies require Node 22.12+):

```sh
npm ci
npm run build
npm test
```

All direct dependency versions are exact, and `package-lock.json` pins the transitive graph with integrity hashes. A build needs no network once dependencies are installed. It reads versioned article snapshots and validates their SHA-256 hashes and all figure hashes. There are no timestamps in generated output, so repeated builds from identical inputs produce identical bytes.

The original paper figures are versioned once under `docs/assets/figures/`, at their final served paths. These are source inputs: do not delete that directory as a build-clean step. Fonts, stylesheets, licenses, pages, and the audit are generated or copied from source/dependencies by `npm run build`.

For local review, serve `docs` with any static HTTP server, for example `python3 -m http.server 8000 --directory docs`.

## Input and rendering provenance

This is an **arXiv HTML → build-time KaTeX → static HTML** pipeline. It does not compile the authors' LaTeX projects. `sources/bswap.html` and `sources/qubex.html` are article-only snapshots extracted from the versioned public arXiv HTML; `sources/provenance.json` records source URLs, hashes, license labels, and immutable figure mappings. Source scientific text and units are not edited.

KaTeX consumes each original TeX annotation. Two conservative structural compatibility rules handle seven redundant quantity delimiters and four local degree macros: the complete supported TeX grammar must agree with the source MathML number, unit semantics, and optional relation. No paper name or node ID participates in these rules. Per-render degree macros never alter the source or leak into later expressions. One reviewed cases-row-spacing adjustment remains an explicitly isolated, exact-source-guarded legacy adapter; its general layout equivalence is not established. Generated accessible annotations retain the original TeX verbatim. Three unsupported simple unit expressions use semantic HTML text through a conservative, versioned SI-unit normalizer; the original MathML and TeX remain unchanged in a hidden source node.

- bSWAP: 895 expressions, 895 KaTeX renders, 1 rendering-only repair, 0 native fallbacks
- QuBE/Qubex: 325 expressions, 322 KaTeX renders, 11 rendering-only repairs, 3 semantic HTML unit normalizations, 0 native fallbacks
- Total: 1,220 expressions, 1,217 KaTeX renders, 12 repairs, 3 semantic HTML unit normalizations, 0 native fallbacks

Counts demonstrate conversion coverage, not mathematical or cross-browser visual equivalence. Native MathML appearance remains browser-dependent. The test suite checks local links/assets/fragments, duplicate and preserved IDs, source text and all original TeX annotations, figure integrity/intrinsics, exact math counts, repairs, fallback preservation, and the three-page publish boundary.

## GitHub Pages

For a project repository, choose **Deploy from a branch**, branch `main`, folder `/docs` in the repository's Pages settings. Every site asset and internal link is relative, so a project subpath works. The committed `.nojekyll` bypasses Jekyll. No Actions workflow or custom domain is required.

`npm run manifest` emits an allowlisted `upload-manifest.json` for source plus generated publication files. `node_modules`, repository metadata, local logs, screenshots, environment configuration, and private work notes are excluded. The manifest can be used by a separate publisher; this build does not upload or change GitHub settings.

## Rights

The scientific content and figures are not MIT-licensed by this repository. Both arXiv source pages identify the arXiv perpetual non-exclusive license; authors and other relevant rightsholders retain their rights. See `NOTICE.md` and the bundled dependency license copies under `docs/assets/`.

Reader CSS and settings JavaScript URLs carry content hashes so HTML updates cannot silently reuse an older resource version. Equation-table baseline alignment preserves the source row alignment while row-spanning equation numbers remain vertically centered.

At desktop widths of 1200 px and above, the 30 original single-column figures float beside text; the seven original two-column figures remain full-width. Classification is based on rendered public v1 PDF artwork positions and matching captions, not aspect ratio or an unverified literal figure* environment. Full evidence and IDs are versioned in sources/figure-layout.json and served as figure-layout.json. bSWAP paired single-column figures retain IDs/order and float individually. Phone layouts stay vertical.

Author affiliations are always visible below the names. Superscript affiliations and contact symbols follow each public v1 PDF first page, verified against the source HTML per author in header-format.cjs. Numbered headings gain terminal punctuation and hanging title alignment; original heading identifiers and numbering are retained.

Original PDF table rules classify five tables as single-column (bSWAP1–3, Qubex3–4) and two as spanning (Qubex1–2). Desktop single-column tables use the figure float width; the native table uses width:100% with automatic column sizing. Source cells, captions, units, IDs, and alignment remain unchanged; exceptionally wide content retains local horizontal scrolling. Evidence is in sources/table-layout.json and the served table-layout.json.

The mathematics pipeline is isolated in math-renderer.cjs: generic structural compatibility recognition → optional isolated legacy layout adapter → KaTeX → conservative semantic-unit normalization for unsupported input → original MathML fallback with diagnostics. math-compat.cjs validates both TeX and MathML before accepting a rule. semantic-units.cjs requires LaTeXML ltx_unit semantics and a supported SI grammar; neither module branches on paper names, IDs, or exact formula strings. Decimal quantities and simple units are supported; arbitrary variables, products, powers, unsupported units, and complex expressions are declined. Tests cover renamed IDs, other SI units/quantities, negative cases, unchanged source DOM, and visual-tree equivalence for the eleven former compatibility fixes.

Remaining content-specific configuration is explicit: sources/legacy-math-repairs.json has one bSWAP cases layout record, guarded by its exact source and applied only through legacy-math-adapter.cjs. sources/math-repairs.json retains twelve old records as regression fixtures, not production recognition rules. Figure/table original-column classifications and author-affiliation mappings are source-document metadata. This architecture does not claim arbitrary LaTeX support; the input remains an arXiv HTML snapshot. Unknown expressions retain their original MathML with diagnostics. The public reading interface contains no renderer counter banner.
