# Architecture and decisions

## Current implementation

Versioned arXiv HTML article snapshots and metadata → build-time normalization and KaTeX → static pages in `docs/`. `build.cjs` orchestrates; it does not compile raw LaTeX. See [README.md](README.md) for exact commands, rendering counts, and publication details.

- `sources/provenance.json`: versioned source URLs, licenses, fingerprints, figure mappings.
- `math-renderer.cjs`: rendering orchestration and audit output.
- `math-compat.cjs`: conservative TeX/MathML-validated compatibility rules.
- `semantic-units.cjs`: semantic SI-unit/quantity recognition; unknown structures are declined.
- `legacy-math-adapter.cjs`: one exact-source-guarded cases layout exception; deliberate debt, outside generic recognition.
- `sources/figure-layout.json`, `sources/table-layout.json`, `header-format.cjs`: source-document layout/affiliation metadata. These are not a general importer yet.
- `reader.css`, `settings.js`, `toc.js`, `anchor.js`: presentation and small client interactions. Scientific image colors remain unchanged; math layout is isolated from prose styling.
- `docs/math-audit.json`: rendering coverage, rule versions, diagnostics, and original TeX. Successful KaTeX output preserves original TeX annotations; the source snapshot remains the authoritative original MathML. Semantic HTML units also retain their original MathML in hidden source nodes.

## Decision record

### A1. Static output and isolated rendering — accepted

Use build-time KaTeX for the present site. No client-side math renderer is needed. A future extension may run the shared transformation locally; it must not copy site-specific branches into a separate engine. A renderer change requires representative visual and semantic comparison, not conversion success alone.

### A2. Conservative recognition — accepted

A normalization rule has a bounded grammar, positive and negative tests, an explicit version, and preservation/audit behavior. No paper IDs in generic recognition. Unsupported expressions retain source MathML with a diagnostic. The single legacy cases adapter remains isolated until a justified general replacement is demonstrated.

### A3. Semantic document core — direction, not implemented

Separate import adapters from semantic content/metadata and presentation. A future document record should carry source identifier and version, canonical URL, license/rights evidence, content fingerprint, importer version, normalizer versions, preserved source, diagnostics, and semantic nodes. Do not treat an arXiv identifier without its version as immutable identity.

Future annotation anchors should combine document/version identity, a stable semantic node or source anchor, and quote/context selectors with reconciliation outcomes. DOM offsets alone are fragile. Changed-source rebasing must be explicit; never silently attach a note to the wrong passage.

### A4. Local-first content and rights — accepted boundary

Future full-text storage/search defaults to local device storage. Fetch/import permission and public redistribution permission are separate. Public corpus tests must use redistributable fixtures or derived minimal synthetic examples, not unlicensed full papers. Accounts, sync, and collaboration require separate design and approval.

### A5. Shared core before platform multiplication — direction

An extension, web library, and native clients should reuse the import/document/render contracts where practical. Native apps are not currently scaffolded. Platform-specific UI and storage belong at the edges; choose technology after the next corpus evidence, not in advance.

## Changes to decisions

Record a dated amendment with rationale, alternatives, evidence, and affected issues/PRs. Do not overwrite historical limitations to make an earlier release appear more capable.

### A6. Personal site and shared reader boundary — accepted direction

`research-portfolio` is the personal research site. A separate future repository will own reusable reader/import modules once extraction is justified by the corpus milestone. Its public name is undecided; Leaf remains the internal working codename. This migration keeps the current reproducible implementation together and does not claim that a package split has already happened. Existing package and browser-storage keys remain unchanged for compatibility.
