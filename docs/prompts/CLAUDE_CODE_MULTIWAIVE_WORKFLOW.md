# Claude Code Prompt — Implement `МНОГОВОЛН. АНАЛИЗ` in ECROS-5400UV simulator

Task: implement a new measurement mode `МНОГОВОЛН. АНАЛИЗ` in the repository and align it with a unified operational workflow.

Repository: `myahlovvlad/ecros-5400uv-simulator`
Branch target: current working branch
Reference specification: `docs/specifications/SPEC-MULTI-001.md`

## Mandatory outcome

Implement the feature in code, not only in documentation.

The simulator must support:

1. Main menu entry `МНОГОВОЛН. АНАЛИЗ`.
2. Number of wavelengths: 2–4.
3. Sequential wavelength entry `λ1..λ4`.
4. Wavelength validation: 190–1100 nm.
5. Value mode selection: `A`, `%T`, `E`.
6. `ZERO` before measurement.
7. `START/STOP` performs sequential measurements for all selected wavelengths.
8. LCD table view of multiwave results.
9. Save/export for a new file group `МНОГОВОЛНОВЫЙ` with extension `.mwl`.
10. USB preview support for exported multiwave data.

## File-level scope

### `src/domain/constants/index.js`

- Add `МНОГОВОЛН. АНАЛИЗ` into `MENU_MAIN`
- Add `MENU_MULTIWAVE`
- Add `МНОГОВОЛНОВЫЙ` into `FILE_GROUPS`
- Add `FILE_EXTENSIONS.МНОГОВОЛНОВЫЙ = '.mwl'`
- Add constants for multiwave limits
- Restrict kinetics duration to `0..600`

### `src/domain/usecases/index.js`

- Extend initial device state with `multiwave`
- Add validators for wave count and multiwave wavelength slots
- Add `measureMultiwaveSeries()`
- Extend `buildUsbExportPreview()`
- Seed example multiwave file in `seedFiles()`

### `src/application/services/DeviceService.js`

Add methods:

- `performMultiwaveMeasure(state)`
- `setMultiwaveCount(state, value)`
- `setMultiwaveWavelength(state, slot, value)`

### `src/application/services/ScreenHandlers.js`

Add handlers:

- `handleMultiwaveMenuScreen`
- `handleMultiwaveWaveCountScreen`
- `handleMultiwaveWaveEntryScreen`
- `handleMultiwaveValueScreen`
- `handleMultiwaveResultsScreen`

### `src/presentation/hooks/useDeviceController.js`

- Register new handlers
- Add new input targets
- Route new screens in `handleAction`
- Route new input handlers in `handleInputAction`

### `src/infrastructure/adapters/LcdRenderer.js`

Add LCD rendering for the new multiwave screens and result table.

### `src/presentation/components/LcdCanvas.jsx`

Do not add a graph for multiwave mode. Use table-only output.

## Operational rules

### Unified workflow

For `ФОТОМЕТРИЯ`, `КОЛИЧ. АНАЛИЗ`, `КИНЕТИКА`, `МНОГОВОЛН. АНАЛИЗ`:

1. Enter mode from main menu
2. Configure parameters
3. Zero
4. Measure
5. Review result
6. Save/export/open via `FILE`

You do not need to fully refactor the whole application into a generic FSM in this task, but the new mode must follow the same navigation semantics as existing modes.

## Multiwave LCD flow

Recommended screens:

1. `multiwaveMenu`
   - `ЧИСЛО λ`
   - `ДЛИНЫ ВОЛН`
   - `ВЕЛИЧИНА`
   - `ПУСК`
2. `multiwaveWaveCount`
3. `multiwaveWaveEntry`
4. `multiwaveValue`
5. `multiwaveResults`

## Data shape

Recommended state shape:

```js
multiwave: {
  waveCount: 2,
  wavelengths: [220.0, 260.0, null, null],
  valueIndex: 0,
  results: [],
  editIndex: 0,
}
```

Recommended result row:

```js
{ index: 1, wavelength: 220.0, energy: 30124, a: 0.4210, t: 37.90 }
```

## Acceptance criteria

1. `npm run build` passes.
2. Existing photometry, quantitative analysis, kinetics and settings still work.
3. New main menu entry is visible and navigable.
4. Invalid wavelength and invalid wave count show warning screens.
5. Multiwave results can be saved.
6. File manager shows `МНОГОВОЛНОВЫЙ` group.
7. Export creates a USB preview record for `.mwl`.

## Definition of Done

Return only when all of the following are true:

- code compiles
- no dead imports remain
- no screen name is referenced without renderer support
- no new file group is missing from save/export logic
- keyboard control and panel buttons both work

## Output format

When done, produce:

1. summary of modified files
2. summary of behavioral changes
3. quick manual test plan
4. known limitations if any remain
