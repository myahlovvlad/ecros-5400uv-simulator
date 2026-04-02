import {
  FILE_ACTIONS,
  FILE_GROUPS,
  MENU_KINETICS,
  MENU_MAIN,
  MENU_MULTIWL,
  MENU_PHOTOMETRY_VALUE,
  MENU_QUANT,
  MENU_SETTINGS,
  STAT_MODES,
  UNITS,
} from "../../domain/constants/index.js";
import {
  formatMmSs,
  getCalibrationDoneCount,
  getCalibrationResultIndexes,
} from "../../domain/usecases/index.js";
import { center, pad } from "../../domain/usecases/utils.js";

function getSampleLabel(device) {
  return (
    {
      reference: "ЭТАЛОН",
      sampleA: "ОБРАЗЕЦ 1",
      holmium: "ХОЛЬМИЙ",
      kinetic: "КИНЕТИКА",
      empty: "ПУСТО",
    }[device.currentSample] ?? "-"
  );
}

export function getLcdRows(device) {
  const rows = [];
  const push = (text, inverted = false) => rows.push({ text: pad(text), inverted });

  if (device.busy) {
    push("");
    push(center(device.busyLabel));
    push("");
    push(center("ИДЕТ ОПЕРАЦИЯ"));
    push("");
    return rows;
  }

  if (device.screen === "boot") {
    push("");
    push(center("ЭКРОС-5400УФ"));
    push("");
    push(center("ДОБРО ПОЖАЛОВАТЬ"));
    return rows;
  }

  if (device.screen === "diagnostic") {
    const items = ["ФИЛЬТРЫ", "ЛАМПЫ", "ДЕТЕКТОР", "Д2-ЛАМПА", "В-ЛАМПА", "КАЛИБР. ЛЯМ", "ТЕМН. ТОК"];
    push("ДИАГНОСТИКА", true);
    items.forEach((item, index) => {
      const status = index < device.diagIndex ? "ОК" : index === device.diagIndex ? "..." : "--";
      push(`${item} ${status}`);
    });
    return rows;
  }

  if (device.screen === "warmup") {
    push("ПРОГРЕВ", true);
    push("ESC - ПРОПУСК");
    push("");
    push(center(formatMmSs(device.warmupRemaining)));
    return rows;
  }

  if (device.screen === "warning") {
    push(center("ПРЕДУПРЕЖДЕНИЕ"), true);
    push(center(device.warning?.title || "ВНИМАНИЕ"));
    const parts = String(device.warning?.body || "").match(/.{1,18}/g) || [""];
    parts.slice(0, 2).forEach((part) => push(center(part)));
    push(center("ВВОД / ESC"));
    return rows;
  }

  if (device.screen === "input") {
    push((device.dialogTitle || "ВВЕДИТЕ ЗНАЧЕНИЕ").toUpperCase(), true);
    push("");
    push(center(device.inputBuffer || "_"));
    push("0-9 . - УДАЛИТЬ");
    push("ВВОД - ПРИНЯТЬ");
    push("ESC - НАЗАД");
    return rows;
  }

  if (device.screen === "saveDialog") {
    push("СОХРАНИТЬ ФАЙЛ", true);
    push(`ТИП ${device.saveMeta.group}`);
    push(`${device.inputBuffer || "_"}${device.saveMeta.suggestedExt}`);
    push("ИМЯ ВРУЧНУЮ");
    push("ВВОД - СОХРАНИТЬ");
    push("ESC - ОТМЕНА");
    return rows;
  }

  if (device.screen === "main") {
    push("ГЛАВНОЕ МЕНЮ", true);
    MENU_MAIN.forEach((item, index) => push(item, device.mainIndex === index));
    push(`${device.wavelength.toFixed(1)} НМ`);
    push(getSampleLabel(device));
    return rows;
  }

  if (device.screen === "fileRoot") {
    push("ФАЙЛОВЫЙ МЕНЕДЖЕР", true);
    FILE_GROUPS.forEach((item, index) => push(item, device.fileRootIndex === index));
    push("ВВОД - ОТКРЫТЬ");
    push("ESC - НАЗАД");
    return rows;
  }

  if (device.screen === "fileList") {
    const group = device.fileContext.group;
    const files = device.files[group] || [];
    push(`ФАЙЛЫ ${group}`, true);
    if (!files.length) {
      push("ПУСТО", true);
      push("ESC - НАЗАД");
      return rows;
    }
    const start = Math.floor(device.fileListIndex / 4) * 4;
    files.slice(start, start + 4).forEach((file, index) => {
      const fileIndex = start + index;
      push(`${file.name}${file.ext}`.slice(0, 20), device.fileListIndex === fileIndex);
    });
    push("ВВОД - ДЕЙСТВИЯ");
    push("ESC - НАЗАД");
    return rows;
  }

  if (device.screen === "fileActionMenu") {
    const selected = (device.files[device.fileContext.group] || [])[device.fileListIndex];
    push(center(selected ? `${selected.name}${selected.ext}` : "ФАЙЛ"), true);
    FILE_ACTIONS.forEach((action, index) => push(action, device.fileActionIndex === index));
    push("ВВОД - ВЫБРАТЬ");
    push("ESC - ОТМЕНА");
    return rows;
  }

  if (device.screen === "photometryValue") {
    push("ФОТОМЕТРИЯ", true);
    MENU_PHOTOMETRY_VALUE.forEach((item, index) => push(item, device.photometryValueIndex === index));
    push("ВВОД - ВЫБРАТЬ");
    push("ESC - НАЗАД");
    return rows;
  }

  if (device.screen === "quantUnits") {
    push("ЕДИНИЦЫ", true);
    const start = Math.floor(device.unitsIndex / 4) * 4;
    UNITS.slice(start, start + 4).forEach((item, index) => {
      const unitIndex = start + index;
      push(item, device.unitsIndex === unitIndex);
    });
    push("ВВОД - ВЫБРАТЬ");
    push("ESC - НАЗАД");
    return rows;
  }

  if (device.screen === "quantMain") {
    push("КОЛИЧ. АНАЛИЗ", true);
    MENU_QUANT.forEach((item, index) => push(item, device.quantIndex === index));
    push(`К=${device.quantK.toFixed(3)}`);
    push(`Б=${device.quantB.toFixed(3)} ${UNITS[device.unitsIndex]}`);
    push("ВВОД - ОТКРЫТЬ");
    return rows;
  }

  if (device.screen === "quantCoef") {
    const concentration = device.quantK * device.lastComputedA + device.quantB;
    push("КОЭФФИЦИЕНТ", true);
    push(`${device.wavelength.toFixed(1)} НМ`);
    push(`${device.lastComputedA.toFixed(3)} А`);
    push(`${concentration.toFixed(3)} ${UNITS[device.unitsIndex]}`);
    push(`К=${device.quantK.toFixed(3)}`);
    push(`Б=${device.quantB.toFixed(3)}`);
    push("START/ФАЙЛ/ESC");
    return rows;
  }

  if (device.screen === "calibrationSetupStandards") {
    push("НОВАЯ ГРАДУИР.", true);
    push("ЧИСЛО СТАНДАРТОВ");
    push(center(String(device.calibration.standards)), true);
    push("СТРЕЛКИ 1..9");
    push("ВВОД - ДАЛЕЕ");
    push("ESC - НАЗАД");
    return rows;
  }

  if (device.screen === "calibrationSetupParallels") {
    push("НОВАЯ ГРАДУИР.", true);
    push("ЧИСЛО ПАРАЛЛЕЛЕЙ");
    push(center(String(device.calibration.parallels)), true);
    push("СТРЕЛКИ 1..9");
    push("ВВОД - ПЛАН");
    push("ESC - НАЗАД");
    return rows;
  }

  if (device.screen === "calibrationPlan") {
    const step = device.calibration.plan[device.calibration.stepIndex];
    push("ПЛАН ИЗМЕРЕНИЙ", true);
    push(`СТАНД. ${device.calibration.standards}`);
    push(`ПАРАЛЛ. ${device.calibration.parallels}`);
    push(`СЛЕД. ${step?.code || "-"}`);
    push(`ГОТОВО ${getCalibrationDoneCount(device.calibration.plan)}/${device.calibration.plan.length}`);
    push("ВВОД - НАЧАТЬ");
    push("НОЛЬ - ОБНУЛИТЬ");
    push("ВНИЗ - ЖУРНАЛ");
    return rows;
  }

  if (device.screen === "calibrationStep") {
    const step = device.calibration.plan[device.calibration.stepIndex];
    push("НОВАЯ ГРАДУИР.", true);
    push(`ВСТАВЬТЕ ${step?.code || "С-1-1"}`);
    push(`СЕРИЯ ${step?.parallelIndex || 1}`);
    push(`СТАНДАРТ ${step?.standardIndex || 1}`);
    push("НОЛЬ - ОБНУЛИТЬ");
    push("START - ИЗМЕРИТЬ");
    push("ESC - ПЛАН");
    return rows;
  }

  if (device.screen === "calibrationJournal") {
    const resultIndexes = getCalibrationResultIndexes(device.calibration.plan);
    const cursor = resultIndexes.includes(device.calibration.resultCursor)
      ? device.calibration.resultCursor
      : resultIndexes[resultIndexes.length - 1] ?? 0;
    const cursorPos = Math.max(0, resultIndexes.indexOf(cursor));
    const start = Math.max(0, cursorPos - 2);
    const visibleIndexes = resultIndexes.slice(start, start + 3);

    push(`ЖУРНАЛ ${getCalibrationDoneCount(device.calibration.plan)}/${device.calibration.plan.length}`, true);
    if (!visibleIndexes.length) {
      push("НЕТ РЕЗУЛЬТАТОВ", true);
    } else {
      visibleIndexes.forEach((index) => {
        const step = device.calibration.plan[index];
        push(`${step.code} А=${step.result.a.toFixed(3)}`, index === cursor);
      });
    }
    push("ВВОД - ДАЛЕЕ");
    push("START - ПЕРЕМЕРИТЬ");
    push("ОЧИСТИТЬ - УДАЛИТЬ");
    return rows;
  }

  if (device.screen === "calibrationGraph") {
    push("ГРАФИК ГРАДУИР.", true);
    push(`ГОТОВО ${getCalibrationDoneCount(device.calibration.plan)}/${device.calibration.plan.length}`);
    if (device.calibration.equation) {
      push(`K=${device.calibration.equation.slope.toFixed(3)}`);
      push(`B=${device.calibration.equation.intercept.toFixed(3)}`);
    }
    push("ESC - ЖУРНАЛ");
    push("ФАЙЛ - СОХРАНИТЬ");
    return rows;
  }

  if (device.screen === "kineticsMenu") {
    push("КИНЕТИКА", true);
    MENU_KINETICS.forEach((item, index) => push(item, device.kineticsIndex === index));
    push(`ВРЕМЯ=${device.kineticDuration}С`);
    push(`А ${device.kineticLower.toFixed(2)}..${device.kineticUpper.toFixed(2)}`);
    return rows;
  }

  if (device.screen === "kineticsRun") {
    push("КИНЕТИКА", true);
    push(`ВРЕМЯ=${device.kineticPoints.at(-1)?.time ?? 0}С`);
    push(`А=${device.lastComputedA.toFixed(3)}`);
    push(`%Т=${device.lastComputedT.toFixed(1)}`);
    push("ВНИЗ - ГРАФИК");
    push("START - СТОП");
    push("ESC - МЕНЮ");
    return rows;
  }

  if (device.screen === "multiwlMain") {
    push("МНОГОВ. АНАЛИЗ", true);
    MENU_MULTIWL.forEach((item, index) => push(item, device.multiwlIndex === index));
    push(`ЛЯМБДА=${device.multiwl.wlCount}`);
    push(`ФОРМУЛА=${device.multiwl.formula}`);
    return rows;
  }

  if (device.screen === "multiwlFormula") {
    push("ФОРМУЛА", true);
    ["RAW", "DIFF", "RATIO"].forEach((item, index) => push(item, device.multiwlFormulaIndex === index));
    push("ВВОД - ВЫБРАТЬ");
    push("ESC - НАЗАД");
    return rows;
  }

  if (device.screen === "multiwlRun") {
    const last = device.multiwlResults.at(-1);
    push("МНОГОВОЛН", true);
    push(`ФОРМУЛА=${device.multiwl.formula}`);
    push(`СТАТУС=${device.multiwl.paused ? "ПАУЗА" : device.taskState}`);
    push(`РЕЗ=${last?.computed?.map((v) => Number(v).toFixed(3)).join("|") || "-"}`.slice(0, 20));
    push("START - ПАУЗА");
    push("ФАЙЛ - СОХРАН.");
    push("ESC - НАЗАД");
    return rows;
  }

  if (device.screen === "settings") {
    push("НАСТРОЙКИ", true);
    MENU_SETTINGS.forEach((item, index) => {
      let label = item;
      if (index === 0) label = `${item} ${device.statisticsMode}`;
      if (index === 1) label = `${item} ${device.d2Lamp ? "ВКЛ" : "ВЫКЛ"}`;
      if (index === 2) label = `${item} ${device.wLamp ? "ВКЛ" : "ВЫКЛ"}`;
      push(label, device.settingsIndex === index);
    });
    return rows;
  }

  if (device.screen === "settingsStatMode") {
    push("СТАТИСТИКА", true);
    STAT_MODES.forEach((item, index) => push(item, device.statisticsModeIndex === index));
    push("ВВОД - ВЫБРАТЬ");
    push("ESC - НАЗАД");
    return rows;
  }

  if (device.screen === "version") {
    push("О СИСТЕМЕ", true);
    push("ЭКРОС-5400УФ");
    push(`ПО ${device.softwareVersion}`);
    push(`АП ${device.hardwareVersion}`);
    push(device.company);
    push("ВВОД/ESC - НАЗАД");
    return rows;
  }

  const valueLabel = MENU_PHOTOMETRY_VALUE[device.photometryValueIndex];
  const currentRows = device.measurements.slice(-3);
  push(`ФОТОМЕТРИЯ ${valueLabel}`, true);
  push(center(`${device.wavelength.toFixed(1)} НМ`));
  push(center(
    device.photometryValueIndex === 0
      ? `${device.lastComputedA.toFixed(3)} А`
      : device.photometryValueIndex === 1
        ? `${device.lastComputedT.toFixed(1)} %Т`
        : `${device.lastEnergy}`,
  ));
  push(`СЕРИЯ ${device.photoSeries?.seriesNo || 1}-${device.photoSeries?.replicateNo || 0}`);
  currentRows.forEach((measurement, localIndex) => {
    const globalIndex = Math.max(0, device.measurements.length - currentRows.length) + localIndex;
    const line = device.photometryValueIndex === 0
      ? `${measurement.index} ${measurement.wavelength.toFixed(1)} ${measurement.a.toFixed(3)}`
      : device.photometryValueIndex === 1
        ? `${measurement.index} ${measurement.wavelength.toFixed(1)} ${measurement.t.toFixed(1)}`
        : `${measurement.index} ${measurement.wavelength.toFixed(1)} ${measurement.energy}`;
    push(line, device.measurements.length > 0 && device.measurementCursor === globalIndex);
  });
  if (!device.measurements.length) push("НЕТ РЕЗУЛЬТАТОВ");
  push(device.measurements.length ? "ВНИЗ ПОСЛЕ СПИСКА" : "START - ИЗМЕРИТЬ");
  return rows;
}
