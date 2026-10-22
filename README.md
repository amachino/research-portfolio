# Research portfolio

Personal research site: [published portfolio](https://amachino.github.io/research-portfolio/). The reader UI, assets and mathematics engine come from the shared Leaf package. This repository owns the portfolio homepage, paper registry, source snapshots and paper-specific presentation adapters.

Start/resume work: [STATUS](STATUS.md). Product direction: [PRODUCT](PRODUCT.md), [ROADMAP](ROADMAP.md), [ARCHITECTURE](ARCHITECTURE.md). Individual tasks and progress live in the maintainer's task tracker; draft PRs review code changes.

Three responsive reading editions of quantum computing papers, with JavaScript KaTeX run **at build time**. The public site contains only an index and the recommended reader for each paper:

- `docs/index.html`
- Three title-derived `.html` reading editions (URLs are recorded as `urlSlug` in `sources/provenance.json`)
- Compatibility redirect pages at `docs/bswap.html`, `docs/qubex.html`, and `docs/matsuda.html`

The Matsuda edition remains arXiv v2, including supplementary material; it is not the publisher’s version of record.

No client-side math renderer, analytics, CDN, or runtime service is required. Appearance settings offer STIX serif or the system sans-serif font, exactly three responsive text sizes (Small/Medium/Large), and Light/Dark themes. On phones the sizes are 14.5/17/20 px with line heights 1.25/1.45/1.55; desktop sizes are 19/22/25 px (Small is 18 px on intermediate screens). Native radio controls sit in a modal dialog presented as a phone bottom sheet. Original scientific figure colors are preserved on white panels. Valid earlier numeric preferences migrate to the closest preset. Preferences are shared across the papers using only localStorage in the same browser; Reset restores Small, Serif, and Light defaults. Browser zoom remains enabled. The math fonts are unchanged, with inline math inheriting the surrounding text size. No preference is transmitted.

Reader pages use the unmodified [official KaTeX copy-tex extension](https://katex.org/docs/libs.html), bundled locally from the pinned KaTeX dependency. Normal Copy writes `$...$` inline and `$$...$$` display source to plain text; the HTML clipboard retains the rendered math DOM. This is an optional official extension, not a guarantee provided by plain KaTeX alone. At copy time it expands selection endpoints inside KaTeX to the complete formula. It does not recognize taps, long presses, or other gestures.

Text and math use standard browser selection, without `user-select:all` or a custom paragraph gesture. Native MathML fallbacks and semantic units no longer receive custom TeX-copy conversion. Block-level whitespace follows the official extension rather than the retired custom serializer. Preserved annotations remain exact, including unexpanded document-specific macros. The extension reads no clipboard data and makes no network requests. Android's selection menu and handles still require device confirmation.

The small `anchor.js` helper corrects initial fragment positioning after local fonts load without interrupting a reader who has interacted with the page. Prose is justified with automatic English hyphenation. At widths of 600 px and below, text uses 14.5 px STIX Two Text and a 1.25 line-height; at 350 px and below it is start-aligned. Citation labels remain upright, figures have intrinsic dimensions, and wide equation/table overflow stays local.

## Rebuild and test

Use Node.js 24.19.0 and npm 11.9.0 (the tested reference versions, recorded in `.nvmrc` and `package.json`; dependencies require Node 22.12+):

```sh
npm ci
npm run build
npm test
```

Registry dependencies use exact versions and integrity hashes; `@amachino/leaf-reader` is pinned to a full Git commit in `package.json` and `package-lock.json`. Installing it requires SSH read access to the private Leaf repository. A build needs no network once dependencies are installed. It reads versioned article snapshots and validates their SHA-256 hashes and all figure hashes. There are no timestamps in generated output, so repeated builds from identical inputs produce identical bytes.

The reader shell and assets are emitted by Leaf's `createPage` and `writeAssets`; the mathematics adapters call its shared engine. The former root-level reader UI files remain for comparison but are not consumed by the build or tests. Generated browser assets are committed under `docs`; no Leaf source tarball is included.

The original paper figures are versioned once under `docs/assets/figures/`, at their final served paths. These are source inputs: do not delete that directory as a build-clean step. Fonts, stylesheets, licenses, pages, and the audit are generated or copied from source/dependencies by `npm run build`.

For local review, serve `docs` with any static HTTP server, for example `python3 -m http.server 8000 --directory docs`.

## Stable title-based URLs

`slug` remains the internal paper identifier used by math repairs, figures, and
header/layout metadata. A separate `urlSlug` identifies its public `.html` URL.
For a newly registered paper with no `urlSlug`, `npm run build` reads the source
article title, lowercases it, folds Latin accents, and joins words with hyphens.
It retains the complete title and saves the generated value in
`sources/provenance.json`. Commit that metadata with the new article. Later
builds reuse the saved value; editing a title does not change the URL. A title
that cannot produce an ASCII slug, or one exceeding the filename limit, requires
an explicit reviewed `urlSlug` rather than silent truncation.

All public routes and internal-ID aliases are validated together before output
is written. Duplicate URLs, collisions with the home page or another paper’s
alias, and unsafe paths fail with a diagnostic instead of overwriting a page.
Do not rename an already published `urlSlug` without an explicit migration.

The old `bswap.html`, `qubex.html`, and `matsuda.html` URLs are small `noindex`
compatibility pages, not duplicate articles. Their local script uses
`location.replace` to retain the complete query and fragment while navigating
to the new URL without adding a Back-button loop. Static GitHub Pages cannot
supply custom per-path HTTP redirects here; with JavaScript disabled, a normal
article link is available instead. No canonical override is added. The home
page remains indexable and its HTML links point directly to the new URLs.
QCE conference bibliographic metadata still has no HTML reading edition.

## Input and rendering provenance

This is an **arXiv HTML → build-time KaTeX → static HTML** pipeline. It does not compile the authors' LaTeX projects. `sources/bswap.html`, `sources/qubex.html`, and `sources/matsuda.html` are article-only snapshots extracted from the versioned public arXiv HTML; `sources/provenance.json` records source URLs, hashes, license labels, and immutable figure mappings. Source scientific text and units are not edited.

KaTeX consumes each original TeX annotation. Two conservative structural compatibility rules handle seven redundant quantity delimiters and four local degree macros: the complete supported TeX grammar must agree with the source MathML number, unit semantics, and optional relation. No paper name or node ID participates in these rules. Per-render degree macros never alter the source or leak into later expressions. One reviewed cases-row-spacing adjustment remains an explicitly isolated, exact-source-guarded legacy adapter; its general layout equivalence is not established. Generated accessible annotations retain the original TeX verbatim. Three unsupported simple unit expressions use semantic HTML text through a conservative, versioned SI-unit normalizer; the original MathML and TeX remain unchanged in a hidden source node.

- bSWAP: 895 expressions, 895 KaTeX renders, 1 rendering-only repair, 0 native fallbacks
- QuBE/Qubex: 325 expressions, 322 KaTeX renders, 11 rendering-only repairs, 3 semantic HTML unit normalizations, 0 native fallbacks
- Matsuda: 204 expressions, 202 KaTeX renders, 0 repairs, 2 original native MathML fallbacks for unsupported color macros
- Total: 1,424 expressions, 1,419 KaTeX renders, 12 repairs, 3 semantic HTML unit normalizations, 2 native fallbacks

Counts demonstrate conversion coverage, not mathematical or cross-browser visual equivalence. Native MathML appearance remains browser-dependent. The test suite checks local links/assets/fragments, duplicate and preserved IDs, source text and all original TeX annotations, figure integrity/intrinsics, exact math counts, repairs, fallback preservation, and the four-content-page plus three-redirect publication boundary.

## GitHub Pages

For a project repository, choose **Deploy from a branch**, branch `main`, folder `/docs` in the repository's Pages settings. Every site asset and internal link is relative, so a project subpath works. The committed `.nojekyll` bypasses Jekyll. No Actions workflow or custom domain is required.

`npm run manifest` emits an allowlisted `upload-manifest.json` for source plus generated publication files. `node_modules`, repository metadata, local logs, screenshots, environment configuration, and private work notes are excluded. The manifest can be used by a separate publisher; this build does not upload or change GitHub settings.

## Rights

The scientific content and figures are not MIT-licensed by this repository. The bSWAP and Qubex arXiv source pages identify the arXiv perpetual non-exclusive license; the Matsuda v2 source identifies CC0 1.0 Universal; authors and other relevant rightsholders retain their rights. See `NOTICE.md` and the bundled dependency license copies under `docs/assets/`.

Reader CSS and settings JavaScript URLs carry content hashes so HTML updates cannot silently reuse an older resource version. Equation-table baseline alignment preserves the source row alignment while row-spanning equation numbers remain vertically centered.

At desktop widths of 1200 px and above, the 30 original single-column figures float beside text; the seven original two-column figures remain full-width. Classification is based on rendered public v1 PDF artwork positions and matching captions, not aspect ratio or an unverified literal figure* environment. Full evidence and IDs are versioned in sources/figure-layout.json and served as figure-layout.json. bSWAP paired single-column figures retain IDs/order and float individually. Phone layouts stay vertical.

Author affiliations are always visible below the names. Superscript affiliations and contact symbols follow each versioned public PDF first page, verified against the source HTML per author in header-format.cjs. Numbered headings gain terminal punctuation and hanging title alignment; original heading identifiers and numbering are retained. Author metadata and numeric section labels (including both navigation variants) carry `translate="no"` and the compatibility `notranslate` class. Heading titles, Abstract, and body prose remain translatable; individual translation tools may not honor these hints. Only the standalone Acknowledgements heading loses its final period, including its navigation labels.

Original PDF table rules classify five tables as single-column (bSWAP1–3, Qubex3–4) and two as spanning (Qubex1–2). Desktop single-column tables use the figure float width; the native table uses width:100% with automatic column sizing. Source cells, captions, units, IDs, and alignment remain unchanged; exceptionally wide content retains local horizontal scrolling. Evidence is in sources/table-layout.json and the served table-layout.json.

The mathematics pipeline is isolated in math-renderer.cjs: generic structural compatibility recognition → optional isolated legacy layout adapter → KaTeX → conservative semantic-unit normalization for unsupported input → original MathML fallback with diagnostics. math-compat.cjs validates both TeX and MathML before accepting a rule. semantic-units.cjs requires LaTeXML ltx_unit semantics and a supported SI grammar; neither module branches on paper names, IDs, or exact formula strings. Decimal quantities and simple units are supported; arbitrary variables, products, powers, unsupported units, and complex expressions are declined. Tests cover renamed IDs, other SI units/quantities, negative cases, unchanged source DOM, and visual-tree equivalence for the eleven former compatibility fixes.

Remaining content-specific configuration is explicit: sources/legacy-math-repairs.json has one bSWAP cases layout record, guarded by its exact source and applied only through legacy-math-adapter.cjs. sources/math-repairs.json retains twelve old records as regression fixtures, not production recognition rules. Figure/table original-column classifications and author-affiliation mappings are source-document metadata. This architecture does not claim arbitrary LaTeX support; the input remains an arXiv HTML snapshot. Unknown expressions retain their original MathML with diagnostics. The public reading interface contains no renderer counter banner.

On individual paper pages at widths up to 900 px, the header stays within reach:
32 px of downward scroll hides it, and 8 px upward reveals it again. Near the
page top, with keyboard focus in the header, or while either reader dialog is
open, it remains visible. Sticky positioning reserves its original flow space;
only its top offset changes, so article layout does not jump. Anchor offsets
track measured header height, and reduced-motion users get no slide animation.
Desktop navigation and the portfolio home page retain their existing behavior.
Without JavaScript, the mobile header remains sticky and visible.

The Matsuda v2 edition preserves all eight original JPEG images byte-for-byte. Their intrinsic dimensions are read from JPEG SOF markers. Main-paper Figures 1–2 and Table I use the original single-column layout; Figures 3–4 and the supplementary figures/table retain full reader width. Classification records the v2 PDF image bounding boxes/table extents, independently of the earlier two-paper visual audit. Public-page browser layout verification remains a separate requirement from the static tests.

QuBE Figures 1, 8, 9 and 13 use SVG converted from the original PDFs in the
public `2606.13010v1` TeX archive. The existing pinned `latexml-oxide` graphics
path (`f129b0b3b6301053a9b1365c872bc7fa4dd40384`) retains vector labels and
geometry together with embedded raster photographs/plots; those raster portions
are not vectorized. Figures 1 and 13 exceed its default 500 KiB PDF limit and
use the existing `--graphics-svg-threshold-kb=2048` option; Figures 8 and 9 use
the default. Conversion runs a graphics-only `graphicx` wrapper with the shared
graphics cache disabled, using pdftocairo 26.04.0 on macOS arm64. Source archive,
PDF, binary and output hashes are recorded in `sources/provenance.json`, and
the earlier PNGs remain available at their original URLs. Figure 14 remains
the original PNG photograph; Figure 18 remains an HTML table. The remaining
figures, source HTML, numbering, captions and links are unchanged. This bounded
asset update is independent of the shared reader migration; figure conversion
remains separate from the reader build.
