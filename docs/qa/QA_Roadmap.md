# QA Roadmap

## Phase 1
- Stabilize selectors with `data-testid` on the instrument panel, LCD editor, tile shell, and width controls.
- Add local Playwright with Chromium smoke tests and automatic screenshot artifacts.
- Aggregate Vitest + Playwright results into repository-level QA reports.

## Phase 2
- Add deterministic LCD bitmap assertions for representative screens.
- Cover file manager flows, USB preview, export actions, and pause/resume.
- Add responsive smoke projects for tablet/mobile widths.

## Phase 3
- Track trend lines for pass rate, visual regressions, and recurring screen-flow failures.
- Add deeper CLI integration coverage and scenario-based acceptance tests.
- Refine debug summaries into actionable issue templates when failures repeat.
