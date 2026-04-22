import { describe, expect, it } from "vitest";
import { transitionToScreen } from "../../src/application/services/screenFlow.js";
import { SCREEN_FLOW_EDGES, SCREEN_INDEX, getScreenTransitions } from "../../src/domain/constants/screens.js";
import { initialDevice } from "../../src/domain/usecases/index.js";

describe("screenFlow", () => {
  it("prepares input transitions with return metadata", () => {
    const state = transitionToScreen(initialDevice(), "input", {
      inputTarget: "wavelength",
      inputBuffer: "546.2",
      dialogTitle: "ВВЕДИТЕ ЛЯМ, НМ",
      returnScreen: "photometry",
    });

    expect(state.screen).toBe("input");
    expect(state.previousScreen).toBe("boot");
    expect(state.inputTarget).toBe("wavelength");
    expect(state.inputBuffer).toBe("546.2");
    expect(state.returnScreen).toBe("photometry");
  });

  it("keeps file context together when opening file list", () => {
    const state = transitionToScreen(initialDevice(), "fileList", {
      group: "ФОТОМЕТРИЯ",
      mode: "browse",
      fileListIndex: 0,
    });

    expect(state.screen).toBe("fileList");
    expect(state.fileContext.group).toBe("ФОТОМЕТРИЯ");
    expect(state.fileContext.mode).toBe("browse");
    expect(state.fileActionIndex).toBe(0);
  });

  it("restores warning screens with an explicit back target", () => {
    const state = transitionToScreen(initialDevice(), "warning", {
      warning: { title: "ОШИБКА", body: "НЕТ ДАННЫХ" },
      warningReturn: "quantCoef",
    });

    expect(state.screen).toBe("warning");
    expect(state.warningReturn).toBe("quantCoef");
    expect(state.warning.title).toBe("ОШИБКА");
  });

  it("includes multiWave screens and graph file/save transitions", () => {
    expect(SCREEN_INDEX.multiWaveMenu).toBe("WND-25");
    expect(SCREEN_INDEX.multiWaveGraph).toBe("WND-29");
    expect(getScreenTransitions("main")).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: "enter", target: "multiWaveMenu" }),
    ]));
    expect(SCREEN_FLOW_EDGES).toContainEqual(["main", "multiWaveMenu", "enter"]);
    expect(SCREEN_FLOW_EDGES).toContainEqual(["photometryGraph", "saveDialog", "file"]);
    expect(SCREEN_FLOW_EDGES).toContainEqual(["kineticsGraph", "saveDialog", "file"]);
    expect(SCREEN_FLOW_EDGES).toContainEqual(["multiWaveGraph", "saveDialog", "file"]);
  });

  it("rejects unknown screen targets in test/dev mode", () => {
    expect(() => transitionToScreen(initialDevice(), "missingScreen")).toThrow("Unknown screen target");
  });
});
