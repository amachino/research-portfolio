# Resume here

Last documented checkpoint: **2026-10-18**. This file describes the checkpoint, not a continuously synchronized branch-head claim. Always inspect the actual remote HEAD and open work first.

## Verified baseline

- Repository: [amachino/research-portfolio](https://github.com/amachino/research-portfolio)
- Site: [published reader](https://amachino.github.io/research-portfolio/)
- Functional baseline commit: [`8272de93d6b74360560286a6b2d9f6e78d2af1ae`](https://github.com/amachino/research-portfolio/commit/8272de93d6b74360560286a6b2d9f6e78d2af1ae)
- Two papers, 1,220 source math expressions: 1,217 KaTeX renders and 3 semantic HTML units; no current native fallbacks. Eleven generic compatibility repairs and one isolated legacy layout adapter.
- Automated baseline: `npm test` passed, including whole-site preservation/link/asset checks, 55 compatibility tests, and 26 semantic-unit fixtures. Commands and toolchain are maintained in README/package metadata.
- Browser evidence: cloud Chrome at narrow 320/390 px and desktop 1280 px, with prior wider-layout checks. Serif/Sans and Light/Dark, local table overflow, and upright units checked. Safari/Firefox and physical-device testing are not claimed.

## Current limitations and next action

Input is an arXiv HTML snapshot, not arbitrary LaTeX. Figure/table column classifications and author affiliations still rely on source-document metadata. One cases-spacing adapter is exact-source-specific. There is no generic import UI, extension, library database, annotation system, account/sync, native app, or collaboration service.

Next bounded milestone: the unfamiliar third-paper local audit in [ROADMAP.md](ROADMAP.md). Do not begin a new product release or publicly redistribute third-party source content as a side effect. [PRODUCT.md](PRODUCT.md) owns scope; [ARCHITECTURE.md](ARCHITECTURE.md) owns design decisions; the maintainer's task tracker owns task status.

## Resume checklist

1. Read this file, the linked design documents, relevant task records and draft PRs, and recent commits. Confirm the next task still matches the latest approved scope.
2. Use a clean checkout of the actual remote branch. Inspect `git status`; preserve uncommitted work. Do not use a remembered commit as permission to overwrite newer work.
3. Follow README toolchain instructions, run `npm ci`, `npm run build`, and `npm test`. Review generated changes and distinguish pre-existing failures from new ones.
4. Pick one bounded task, record acceptance criteria, and create `feat/<task>-<slug>`, `fix/<task>-<slug>`, or `docs/<task>-<slug>`. Use a draft PR for work in progress. Do not force-push shared branches or silently change Pages settings.
5. Keep source changes and regenerated `docs/` together when relevant. `docs/assets/figures/` contains source inputs: do not delete it as build cleanup. Never commit credentials, private notes, browser profiles, local logs, or an unlicensed imported corpus.
6. Run relevant unit/preservation checks and actual browser QA for UI changes. Record exact commit, viewport/browser, passed/failed/not-run coverage, and limitations in the PR. Mathematical correctness is not established by successful rendering alone.
7. Publication is a distinct checkpoint: merge/deploy only within explicit authorization, verify the remote commit and Pages result, then verify served content/assets. Direct-to-main was used for the initial authorized site iterations; future multi-day changes should normally use reviewable branches/PRs. Branch protection is not claimed to be configured.
8. Before stopping: update the task record/PR with what changed, tests, remaining work/blockers, next exact action, and commit. Update this file only for a meaningful checkpoint; keep roadmap state in issues and preserve historical reports.

## Documentation ownership

Avoid duplicate sources of truth: README = run/build/rights; PRODUCT = goals/boundaries; ROADMAP = stages/gates; ARCHITECTURE = contracts/decisions; STATUS = resume checkpoint. Link to detailed evidence and issues rather than copying their mutable status into every file.

## Repository migration (2026-10-18)

The public repository was copied to `amachino/research-portfolio` with its Git revision history using GitHub Importer; the imported head was `652e5f393f1b64df26dab326db310444f729a010` (28 commits). The old `paper-atelier` repository is retained, not deleted. The new portfolio is the canonical development/publication target; old URL compatibility is not a requirement. Pages serves `main:/docs`. The reusable reader remains in this tree temporarily; its later extraction is a separate scoped task, not a completed split.
