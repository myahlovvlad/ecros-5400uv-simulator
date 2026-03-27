export const LCD_W = 128;
export const LCD_H = 64;
export const CHAR_H = 8;
export const LCD_COLS = 20;
export const LCD_ROWS = 8;
export const LCD_SCALE = 10;

export const WL_MIN = 190;
export const WL_MAX = 1100;

export const GAIN_MIN = 1;
export const GAIN_MAX = 8;

export const DARK_VALUES = [39, 74, 152, 302, 585, 1079, 1880, 3148];

export const CLI_COMMANDS = [
  "connect",
  "quit",
  "rezero",
  "getdark",
  "resetdark",
  "ge",
  "swl",
  "getwl",
  "sa",
  "ga",
  "setlampwl",
  "wuon",
  "wuoff",
  "d2on",
  "d2off",
  "gettype",
  "setfilter",
  "setlamp",
  "getlampwl",
  "getd2",
  "getwu",
  "getsoftver",
  "gethardver",
  "swm",
  "adjustwl",
  "help",
  "company",
  "startwl",
  "endwl",
  "getslip",
  "getsampler",
  "setslip",
  "setsampler",
  "diag",
];

export const MENU_MAIN = ["ФОТОМЕТРИЯ", "КОЛИЧ. АНАЛИЗ", "КИНЕТИКА", "НАСТРОЙКИ"];
export const MENU_PHOTOMETRY_VALUE = ["А", "%Т", "ЭНЕРГИЯ"];
export const MENU_QUANT = ["НОВАЯ ГРАДУИР.", "КОЭФФИЦИЕНТ", "ЕДИНИЦЫ"];
export const MENU_KINETICS = ["ВЕЛИЧИНА", "ВЕРХ. ГРАНИЦА", "НИЖ. ГРАНИЦА", "ОБЩЕЕ ВРЕМЯ", "ПУСК"];
export const MENU_SETTINGS = ["Д2-ЛАМПА", "В-ЛАМПА", "ТЕМНОВОЙ ТОК", "КАЛИБР. ЛЯМ", "ВЕРСИЯ", "СБРОС"];
export const FILE_GROUPS = ["ФОТОМЕТРИЯ", "ГРАДУИРОВКА", "КОЭФФИЦИЕНТ", "КИНЕТИКА"];
export const FILE_ACTIONS = ["ОТКРЫТЬ", "ПЕРЕИМЕНОВАТЬ", "УДАЛИТЬ", "ЭКСПОРТ"];
export const UNITS = ["МКГ/Л", "МГ/Л", "Г/Л", "МЛ/Л", "МОЛЬ/Л", "МГ/КГ", "%", "ТСУ"];

export const SAMPLE_OPTIONS = [
  { value: "reference", label: "ЭТАЛОН" },
  { value: "sampleA", label: "ОБРАЗЕЦ 1" },
  { value: "holmium", label: "ХОЛЬМИЕВОЕ СТЕКЛО" },
  { value: "kinetic", label: "КИНЕТИЧ. ОБРАЗЕЦ" },
  { value: "empty", label: "ПУСТАЯ ПОЗИЦИЯ" },
];

export const FILE_EXTENSIONS = {
  ФОТОМЕТРИЯ: ".qua",
  ГРАДУИРОВКА: ".std",
  КОЭФФИЦИЕНТ: ".cof",
  КИНЕТИКА: ".kin",
};

export const VALID_FILE_RE = /^[A-Za-zА-Яа-я0-9 _.-]+$/;

export const BOOT_DELAY_MS = 600;
export const DIAG_STEP_DELAY_MS = 350;
export const DIAG_COMPLETE_DELAY_MS = 500;
export const WARMUP_STEP_MS = 80;
export const WARMUP_DURATION_SEC = 15 * 60;
export const KINETIC_INTERVAL_MS = 500;
