# QA Plan

## Scope
- Unit regression for domain logic, device services, state bus, and LCD renderer helpers.
- UI smoke regression for the instrument panel, LCD editor, CLI emulator, sidebar tiles, and responsive shell.
- Artifact capture for full-page screenshots, LCD screenshots, Playwright traces, videos, and debug summaries.

## Primary risks
- Bitmap LCD regressions where row preview and real LCD diverge visually.
- Clickability regressions after layout changes, tile collapsing, or panel resizing.
- State synchronization regressions between CLI, device status, LCD render, and sidebar editors.
- Responsive shell overflow that hides critical tiles or breaks the panel composition.

## Quality gates
- `npm run test:unit:qa` must generate a green or explicitly reviewable Vitest report.
- `npm run test:ui` must complete without Playwright failures.
- `npm run test:ui` must also pass Playwright baseline screenshot comparison for the panel shell, LCD frame, device status after CLI wavelength change, and LCD editor tile state.
- `npm run qa:report` must produce `qa_reports.json`, `debug_summary.txt`, and `qa_dashboard.html`.

## Current focus
- Keep E2E coverage intentionally shallow but stable: boot, panel clickability, CLI wavelength change, LCD editor interaction, screenshot capture, and committed pixel baselines.
- Expand only after the bitmap LCD state becomes deterministic enough for broader baseline coverage.
