import { CLI_COMMANDS, DARK_VALUES, GAIN_MAX, GAIN_MIN, WL_MAX, WL_MIN } from "../../domain/constants/index.js";
import { addNoise, measureSample, referenceEnergyAt } from "../../domain/usecases/index.js";
import { clamp } from "../../domain/usecases/utils.js";

export class CliService {
  async execute(command, state, log, setState, setBusy) {
    const cmd = command.trim();
    if (!cmd) return;

    log(`> ${cmd}`);
    const [op, arg] = cmd.split(/\s+/);

    const reply = (line) => log(String(line));
    const replyBlank = () => log("");

    if (op === "help") {
      reply("Command List:");
      reply(CLI_COMMANDS.join("   "));
      return;
    }

    if (op === "connect") {
      await new Promise((resolve) => setTimeout(resolve, 50));
      reply("ok.");
      return;
    }

    if (op === "quit") return replyBlank();
    if (op === "company") return reply(state.company);
    if (op === "getsoftver") return reply(state.softwareVersion);
    if (op === "gethardver") return reply(state.hardwareVersion);
    if (op === "startwl") return reply(` ${WL_MIN.toFixed(1)}`);
    if (op === "endwl") return reply(`${WL_MAX.toFixed(1)}`);
    if (op === "getwl") return reply(` ${state.wavelength.toFixed(1)}`);

    if (op === "swl" || op === "swm") {
      const wavelength = clamp(parseFloat(arg || String(state.wavelength)), WL_MIN, WL_MAX);
      setState((d) => ({ ...d, wavelength }));
      await setBusy(op === "swl" ? "УСТАНОВКА ЛЯМ" : "ПОВОРОТ РЕШЕТКИ", op === "swl" ? 900 : 650);
      return replyBlank();
    }

    if (op === "rezero") {
      const e100 = addNoise(referenceEnergyAt(state.wavelength), 10);
      setState((d) => ({ ...d, e100, gain: 1, lastEnergy: e100, lastComputedA: 0, lastComputedT: 100 }));
      await new Promise((resolve) => setTimeout(resolve, 350));
      reply(e100);
      reply(1);
      return replyBlank();
    }

    if (op === "resetdark") {
      await new Promise((resolve) => setTimeout(resolve, 450));
      DARK_VALUES.forEach((value) => reply(value));
      setState((d) => ({ ...d, darkValues: [...DARK_VALUES] }));
      return replyBlank();
    }

    if (op === "getdark") {
      state.darkValues.forEach((value) => reply(value));
      return replyBlank();
    }

    if (op === "ge") {
      const count = clamp(parseInt(arg || "1", 10) || 1, 1, 8);
      for (let index = 0; index < count; index += 1) {
        const measurement = measureSample({
          sample: state.currentSample,
          wavelength: state.wavelength,
          gain: state.gain,
          e100: state.e100,
          darkValues: state.darkValues,
        });
        reply(measurement.energy);
        setState((d) => ({ ...d, lastEnergy: measurement.energy, lastComputedA: measurement.a, lastComputedT: measurement.t }));
      }
      return replyBlank();
    }

    if (op === "sa") {
      const gain = clamp(parseInt(arg || "1", 10) || 1, GAIN_MIN, GAIN_MAX);
      setState((d) => ({ ...d, gain }));
      return replyBlank();
    }

    if (op === "ga") {
      reply(state.gain);
      return replyBlank();
    }

    if (op === "setlampwl") {
      const value = parseFloat(arg || String(state.lampWL));
      setState((d) => ({ ...d, lampWL: value }));
      return replyBlank();
    }

    if (op === "getlampwl") return reply(` ${state.lampWL.toFixed(1)}`);
    if (op === "wuon") return setState((d) => ({ ...d, wLamp: true })) || replyBlank();
    if (op === "wuoff") return setState((d) => ({ ...d, wLamp: false })) || replyBlank();
    if (op === "d2on") return setState((d) => ({ ...d, d2Lamp: true })) || replyBlank();
    if (op === "d2off") return setState((d) => ({ ...d, d2Lamp: false })) || replyBlank();
    if (op === "getd2") return reply(state.d2Lamp ? 1 : 0);
    if (op === "getwu") return reply(state.wLamp ? 1 : 0);
    if (op === "getslip") return reply(state.slip);

    if (op === "setslip") {
      const slip = clamp(parseInt(arg || "2", 10) || 2, 1, 4);
      setState((d) => ({ ...d, slip }));
      return replyBlank();
    }

    if (op === "getsampler") return reply(state.sampler);
    if (op === "setsampler") return reply("Error");

    if (op === "adjustwl") {
      await setBusy("КАЛИБРОВКА ЛЯМБДА", 1600);
      return replyBlank();
    }

    if (op === "diag") {
      ["FILTER=3", "LAMP=3", "SENSOR=3", "D2=3", "W=3", "WL=3", "DARK=3"].forEach(reply);
      return;
    }

    if (op === "setfilter" || op === "setlamp") return replyBlank();
    if (op === "gettype") return reply("ECROS-5400UV");
    return reply("Unknown command");
  }
}
