# API Документация

## CLI API

### Команды подключения

#### connect
Подключение к устройству.

**Запрос:**
```
connect
```

**Ответ:**
```
ok.
```

**Задержка:** 50 мс

---

#### quit
Отключение от устройства.

**Запрос:**
```
quit
```

**Ответ:**
```
(пустая строка)
```

---

#### company
Получение названия производителя.

**Запрос:**
```
company
```

**Ответ:**
```
METASH Instrument
```

---

### Команды версии

#### getsoftver
Получение версии программного обеспечения.

**Запрос:**
```
getsoftver
```

**Ответ:**
```
2.8.46
```

---

#### gethardver
Получение версии аппаратного обеспечения.

**Запрос:**
```
gethardver
```

**Ответ:**
```
R0D
```

---

### Команды длины волны

#### startwl
Получение минимальной длины волны.

**Запрос:**
```
startwl
```

**Ответ:**
```
 190.0
```

---

#### endwl
Получение максимальной длины волны.

**Запрос:**
```
endwl
```

**Ответ:**
```
1100.0
```

---

#### getwl
Получение текущей длины волны.

**Запрос:**
```
getwl
```

**Ответ:**
```
 546.2
```

---

#### swl \<wavelength\>
Установка длины волны.

**Запрос:**
```
swl 500
```

**Параметры:**
| Параметр | Тип | Диапазон |
|----------|-----|----------|
| wavelength | number | 190–1100 нм |

**Ответ:**
```
(пустая строка)
```

**Задержка:** 900 мс

**Ошибки:**
```
Error: invalid wavelength
```

---

#### swm \<wavelength\>
Поворот монохроматора на заданную длину волны.

**Запрос:**
```
swm 500
```

**Ответ:**
```
(пустая строка)
```

**Задержка:** 650 мс

---

#### adjustwl
Калибровка длины волны.

**Запрос:**
```
adjustwl
```

**Ответ:**
```
(пустая строка)
```

**Задержка:** 1600 мс

---

### Команды измерения

#### rezero
Калибровка нуля (ZERO).

**Запрос:**
```
rezero
```

**Ответ:**
```
33869
1
(пустая строка)
```

**Возвращает:**
1. Энергия 100%
2. Усиление (всегда 1)

**Задержка:** 350 мс

---

#### getdark
Получение значений темнового тока.

**Запрос:**
```
getdark
```

**Ответ:**
```
39
74
152
302
585
1079
1880
3148
(пустая строка)
```

---

#### resetdark
Сброс значений темнового тока.

**Запрос:**
```
resetdark
```

**Ответ:**
```
39
74
152
302
585
1079
1880
3148
(пустая строка)
```

**Задержка:** 450 мс

---

#### ge [count]
Измерение энергии (get energy).

**Запрос:**
```
ge 2
```

**Параметры:**
| Параметр | Тип | Диапазон | По умолчанию |
|----------|-----|----------|--------------|
| count | number | 1–8 | 1 |

**Ответ:**
```
33869
33845
(пустая строка)
```

---

### Команды усиления

#### sa \<gain\>
Установка усиления (set amplification).

**Запрос:**
```
sa 3
```

**Параметры:**
| Параметр | Тип | Диапазон |
|----------|-----|----------|
| gain | number | 1–8 |

**Ответ:**
```
(пустая строка)
```

---

#### ga
Получение текущего усиления (get amplification).

**Запрос:**
```
ga
```

**Ответ:**
```
1
(пустая строка)
```

---

### Команды ламп

#### wuon
Включение W-лампы.

**Запрос:**
```
wuon
```

**Ответ:**
```
(пустая строка)
```

---

#### wuoff
Выключение W-лампы.

**Запрос:**
```
wuoff
```

**Ответ:**
```
(пустая строка)
```

---

#### d2on
Включение D2-лампы.

**Запрос:**
```
d2on
```

**Ответ:**
```
(пустая строка)
```

---

#### d2off
Выключение D2-лампы.

**Запрос:**
```
d2off
```

**Ответ:**
```
(пустая строка)
```

---

#### getwu
Получение статуса W-лампы.

**Запрос:**
```
getwu
```

**Ответ:**
```
1  (включена)
0  (выключена)
```

---

#### getd2
Получение статуса D2-лампы.

**Запрос:**
```
getd2
```

**Ответ:**
```
1  (включена)
0  (выключена)
```

---

#### setlampwl \<wavelength\>
Установка длины волны лампы.

**Запрос:**
```
setlampwl 340.5
```

**Параметры:**
| Параметр | Тип |
|----------|-----|
| wavelength | number |

**Ответ:**
```
(пустая строка)
```

---

#### getlampwl
Получение длины волны лампы.

**Запрос:**
```
getlampwl
```

**Ответ:**
```
 340.5
```

---

### Команды щели и сэмплера

#### getslip
Получение текущей щели.

**Запрос:**
```
getslip
```

**Ответ:**
```
2
```

---

#### setslip \<slip\>
Установка щели.

**Запрос:**
```
setslip 3
```

**Параметры:**
| Параметр | Тип | Диапазон |
|----------|-----|----------|
| slip | number | 1–4 |

**Ответ:**
```
(пустая строка)
```

---

#### getsampler
Получение статуса сэмплера.

**Запрос:**
```
getsampler
```

**Ответ:**
```
0
```

---

#### setsampler \<value\>
Установка сэмплера (всегда ошибка).

**Запрос:**
```
setsampler 1
```

**Ответ:**
```
Error
```

---

### Команды диагностики

#### diag
Получение результатов диагностики.

**Запрос:**
```
diag
```

**Ответ:**
```
Filter=3
Lamp=3
Sensor=3
D2 Lamp=3
W Lamp=3
Calib. WL=3
System=3
Dark=3
```

**Значения статуса:**
- `3` — OK
- `2` — Warning
- `1` — Error
- `0` — Not checked

---

### Служебные команды

#### help
Получение списка команд.

**Запрос:**
```
help
```

**Ответ:**
```
Command List:
connect   quit   rezero   getdark   resetdark   ge   swl   getwl   sa   ga   setlampwl   wuon   wuoff   d2on   d2off   gettype   setfilter   setlamp   getlampwl   getd2   getwu   getsoftver   gethardver   swm   adjustwl   ud   cap   help   company   startwl   endwl   getslip   getsampler   setslip   setsampler   btcfg   btcheck   diag
```

---

#### gettype
Получение типа устройства.

**Запрос:**
```
gettype
```

**Ответ:**
```
ECROS-5400UV
```

---

#### setfilter
Установка фильтра (заглушка).

**Запрос:**
```
setfilter 1
```

**Ответ:**
```
(пустая строка)
```

---

#### setlamp
Установка лампы (заглушка).

**Запрос:**
```
setlamp 1
```

**Ответ:**
```
(пустая строка)
```

---

#### ud
Команда ud (заглушка).

**Запрос:**
```
ud
```

**Ответ:**
```
(пустая строка)
```

---

#### cap
Команда cap (заглушка).

**Запрос:**
```
cap
```

**Ответ:**
```
(пустая строка)
```

---

#### btcfg
Настройка Bluetooth (заглушка).

**Запрос:**
```
btcfg
```

**Ответ:**
```
(пустая строка)
```

---

#### btcheck
Проверка Bluetooth (заглушка).

**Запрос:**
```
btcheck
```

**Ответ:**
```
(пустая строка)
```

---

## JavaScript API

### useDeviceController Hook

**Импорт:**
```javascript
import { useDeviceController } from './src/hooks/useDeviceController';
```

**Возвращаемое значение:**
```javascript
{
  device,              // Текущее состояние устройства
  setDevice,           // Функция обновления состояния
  cliValue,            // Текущее значение CLI
  setCliValue,         // Установка значения CLI
  handleAction,        // Обработка действий
  executeCli,          // Выполнение CLI команды
  resetAll,            // Сброс всех настроек
  performRezero,       // Калибровка нуля
  performPhotometryMeasure,  // Измерение образца
  performDarkCurrent,  // Калибровка темнового тока
  performWavelengthCalibration,  // Калибровка длины волны
  startKinetics,       // Запуск кинетики
  stopKinetics,        // Остановка кинетики
  openFileManager,     // Открыть файловый менеджер
  openSaveDialog,      // Открыть диалог сохранения
  deleteFile,          // Удалить файл
  exportFile,          // Экспорт файла
  showWarning,         // Показать предупреждение
  logLine              // Добавить запись в лог
}
```

**Пример использования:**
```javascript
function MyComponent() {
  const {
    device,
    handleAction,
    performRezero
  } = useDeviceController();

  return (
    <button onClick={() => handleAction('ZERO')}>
      ZERO
    </button>
  );
}
```

---

### DeviceService

**Импорт:**
```javascript
import { DeviceService } from './src/application/services/DeviceService';
```

**Методы:**

#### performRezero(state)
```javascript
const { newState, logEntry } = deviceService.performRezero(state);
```

#### performPhotometryMeasure(state)
```javascript
const { newState, logEntry, measurement } = deviceService.performPhotometryMeasure(state);
```

#### performCalibrationMeasure(state)
```javascript
const { newState, logEntry } = deviceService.performCalibrationMeasure(state);
```

#### performDarkCurrent(state)
```javascript
const { newState, logEntry } = deviceService.performDarkCurrent(state);
```

#### performWavelengthCalibration(state)
```javascript
const { newState, logEntry } = deviceService.performWavelengthCalibration(state);
```

#### deleteFile(state, group, index)
```javascript
const { newState, logEntry, fileName } = deviceService.deleteFile(state, 'Фотометрия', 0);
```

#### exportFile(state, group, index)
```javascript
const { newState, logEntry } = deviceService.exportFile(state, 'Фотометрия', 0);
```

#### renameFile(state, group, index, newName)
```javascript
const { newState, error } = deviceService.renameFile(state, 'Фотометрия', 0, 'NewName');
```

#### saveFile(state, name)
```javascript
const { newState, error, logEntry } = deviceService.saveFile(state, 'MyFile');
```

#### setWavelength(state, value)
```javascript
const { newState, error, logEntry } = deviceService.setWavelength(state, 546.2);
```

#### setQuantCoefficient(state, type, value)
```javascript
const { newState, error } = deviceService.setQuantCoefficient(state, 'K', 1.5);
```

#### setKineticParameter(state, type, value)
```javascript
const { newState, error } = deviceService.setKineticParameter(state, 'upper', 2.0);
```

---

### CliService

**Импорт:**
```javascript
import { CliService } from './src/application/services/CliService';
```

**Метод execute:**
```javascript
const cliService = new CliService();
await cliService.execute(command, state, log, setState, setBusy);
```

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| command | string | CLI команда |
| state | Object | Текущее состояние |
| log | Function | Функция логирования |
| setState | Function | Функция обновления состояния |
| setBusy | Function | Функция установки busy |

---

## Обработка ошибок

### Формат ошибок CLI

```
Error: <описание>
```

### Формат ошибок валидации

```javascript
{
  valid: false,
  error: "<описание>"
}
```

### Предупреждения UI

```javascript
{
  title: "<заголовок>",
  body: "<описание>",
  returnScreen: "<экран возврата>"
}
```
