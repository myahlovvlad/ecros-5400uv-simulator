# QA Setup

## Local stack
- Unit tests: `Vitest`
- UI regression: `Playwright`
- Reports: `qa_reports.json`, `debug_summary.txt`, `qa_dashboard.html`, `risk_trends.csv`

## Commands
- `npm run test:unit:qa` — runs Vitest and saves JSON to `qa-artifacts/unit/vitest-report.json`
- `npm run test:ui` — runs Playwright smoke tests and saves UI artifacts
- `npm run test:ui:update-snapshots` — refreshes committed Playwright visual baselines
- `npm run qa:report` — merges available reports into repository-level QA summaries
- `npm run qa:full` — full local QA cycle
- `npm run test:ui:debug` — headed Playwright debug session

## Stored artifacts
- `qa-artifacts/ui/screenshots` — deterministic smoke screenshots
- `test-results/playwright` — traces and videos for failing UI tests
- `playwright-report` — browsable HTML report
- `tests/ui/*.spec.js-snapshots` — committed pixel-diff baselines used as visual gates

## VS Code tasks
- `QA: Unit Report`
- `QA: UI Smoke`
- `QA: Update Visual Baselines`
- `QA: Full Report`
- `QA: Generate Report Only`
- `QA: Debug Playwright`

## Visual gate
- `test:ui` is now pixel-diff gated through Playwright `toHaveScreenshot`.
- If UI was intentionally changed, update baselines with `npm run test:ui:update-snapshots`, review the snapshot diff, and rerun `npm run test:ui`.
