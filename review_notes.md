# QA Review Notes

## Current signal
- Unit coverage signal: 34/34 passing.
- UI coverage signal: 3/3 passing.

## Actionable recommendations
- Keep smoke tests focused on hardware-panel interactions, LCD editor flows, CLI commands, and file/export paths.
- Keep the Playwright baseline snapshots under review when UI or bitmap rendering changes intentionally.
- Expand Vitest around presentation-layer state transforms to catch UI regressions before E2E.