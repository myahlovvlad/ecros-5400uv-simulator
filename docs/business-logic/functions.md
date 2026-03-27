# Спецификация функций доменного слоя

## Модуль: domain/usecases/index.js

### referenceEnergyAt(wl)

**Назначение:** Расчёт справочной энергии источника света на заданной длине волны.

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| wl | number | Длина волны в нм (190–1100) |

**Возвращает:** `number` — энергия в условных единицах (12000–60000)

**Алгоритм:**
```javascript
trend = 33880 - Math.abs(wl - 540) * 4.2
ripple = 320 * Math.sin(wl / 46) + 120 * Math.cos(wl / 23)
result = clamp(trend + ripple, 12000, 60000)
```

**Примеры:**
```javascript
referenceEnergyAt(540)  // ~34200
referenceEnergyAt(190)  // ~26000
referenceEnergyAt(1100) // ~29000
```

---

### absorbanceForSample(sample, wl, t)

**Назначение:** Расчёт оптической плотности образца на заданной длине волны.

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| sample | string | Тип образца |
| wl | number | Длина волны в нм |
| t | number | Время в секундах (для kinetic) |

**Возвращает:** `number` — оптическая плотность (Abs)

**Типы образцов:**

#### reference
- **Возврат:** 0 (полное пропускание)

#### empty
- **Возврат:** 3.2 (почти полное поглощение)

#### sampleA
- **Модель:** Двухпиковый спектр
- **Пики:** 505 нм (A=0.4), 620 нм (A=0.3)
- **Формула:**
  ```
  A = 0.18 + 
      0.22 * exp(-(wl-505)² / 968) +
      0.11 * exp(-(wl-620)² / 2450)
  ```

#### holmium
- **Модель:** Многопиковый спектр (холмиевое стекло)
- **Пики:** 241, 279, 287, 333, 361, 418, 451, 537, 640 нм
- **Ширина пика:** σ = 2.2 нм
- **Амплитуда:** 0.9 на пик
- **Диапазон:** 0–3.4

#### kinetic
- **Модель:** Временная зависимость (химическая реакция)
- **Базовая линия:** Пик при 546 нм
- **Рост:** Экспоненциальный к 0.75
- **Время реакции:** τ = 18 с
- **Формула:**
  ```
  baseline = 0.08 + 0.04 * exp(-(wl-546)² / 1800)
  rise = 0.75 * (1 - exp(-t/18))
  A = clamp(baseline + rise, 0, 2.5)
  ```

---

### measureSample(params)

**Назначение:** Полное измерение образца с шумом и коррекцией.

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| sample | string | Тип образца |
| wavelength | number | Длина волны в нм |
| gain | number | Усиление (1–8) |
| e100 | number | Энергия 100% |
| darkValues | number[] | Массив темнового тока (8 значений) |
| timeSec | number | Время (для kinetic) |

**Возвращает:** `Object`
```javascript
{
  dark: number,    // Значение темнового тока
  energy: number,  // Измеренная энергия с шумом
  t: number,       // Пропускание % (0–200)
  a: number        // Оптическая плотность (-0.3–3.999)
}
```

**Алгоритм:**
```javascript
1. dark = darkValues[gain - 1] ?? darkValues[0]
2. ref = referenceEnergyAt(wavelength)
3. absorbance = absorbanceForSample(sample, wavelength, timeSec)
4. rawEnergy = clamp(ref * 10^(-absorbance), dark+1, 65000)
5. noisy = clamp(addNoise(rawEnergy, 18), dark+1, 65000)
6. correctedT = clamp((noisy - dark) / max(1, e100 - dark), 0.0001, 2)
7. A = -log10(correctedT)
8. return { dark, energy: noisy, t: correctedT*100, a: A }
```

---

### addNoise(base, amplitude)

**Назначение:** Добавление случайного шума к значению.

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| base | number | Базовое значение |
| amplitude | number | Амплитуда шума (по умолчанию 12) |

**Возвращает:** `number` — значение с шумом

**Формула:**
```javascript
result = round(base + (random() * 2 - 1) * amplitude)
```

**Диапазон шума:** `[-amplitude, +amplitude]`

---

### buildCalibrationPlan(standards, parallels)

**Назначение:** Построение плана измерений для градуировки.

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| standards | number | Число стандартов (1–9) |
| parallels | number | Число параллелей (1–9) |

**Возвращает:** `CalibrationStep[]` — массив шагов

**Структура шага:**
```javascript
{
  id: string,           // "S-P"
  code: string,         // "C-S-P"
  standardIndex: number,
  parallelIndex: number,
  opInsert: number,     // Порядковый номер операции вставки
  opMeasure: number,    // Порядковый номер операции измерения
  status: "pending",    // Статус выполнения
  result: null          // Результат измерения (заполняется после)
}
```

**Порядок измерений:**
```
standards=3, parallels=2:
1-1, 2-1, 3-1, 1-2, 2-2, 3-2
(сначала все стандарты первой параллели, затем второй)
```

---

### formatMmSs(sec)

**Назначение:** Форматирование времени в мм:сс.

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| sec | number | Секунды |

**Возвращает:** `string` — форматированное время

**Примеры:**
```javascript
formatMmSs(0)     // "00:00"
formatMmSs(60)    // "01:00"
formatMmSs(900)   // "15:00"
formatMmSs(3661)  // "61:01"
```

---

### fileExtByGroup(group)

**Назначение:** Получение расширения файла по группе.

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| group | string | Группа файлов |

**Возвращает:** `string` — расширение

**Маппинг:**
| Группа | Расширение |
|--------|------------|
| Фотометрия | .qua |
| Градуировка | .std |
| Коэффициент | .cof |
| Кинетика | .kin |

---

### seedFiles()

**Назначение:** Инициализация начальных файлов.

**Возвращает:** `Object.<string, DeviceFile[]>`

**Структура:**
```javascript
{
  "Фотометрия": [
    { name: "Blank_540", ext: ".qua", exported: false },
    { name: "Holmium_test", ext: ".qua", exported: true }
  ],
  "Градуировка": [
    { name: "Fe_series_v1", ext: ".std", exported: false }
  ],
  "Коэффициент": [
    { name: "Protein_KB", ext: ".cof", exported: false }
  ],
  "Кинетика": [
    { name: "Reaction_A", ext: ".kin", exported: false }
  ]
}
```

---

### initialDevice()

**Назначение:** Создание начального состояния устройства.

**Возвращает:** `DeviceState` — полное состояние устройства

**Ключевые значения по умолчанию:**
```javascript
{
  screen: "boot",
  wavelength: 546.2,
  gain: 1,
  slip: 2,
  sampler: 0,
  d2Lamp: true,
  wLamp: true,
  e100: 33869,
  quantK: 1,
  quantB: 0,
  kineticDuration: 60,
  kineticUpper: 1.5,
  kineticLower: 0,
  warmupRemaining: 900,  // 15 минут
  currentSample: "reference",
  softwareVersion: "2.8.46",
  hardwareVersion: "R0D",
  company: "METASH Instrument"
}
```

---

### validateFileName(name)

**Назначение:** Валидация имени файла.

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| name | string | Имя файла |

**Возвращает:** `Object`
```javascript
// Успех:
{ valid: true }

// Ошибка:
{ valid: false, error: "Пустое имя" }
```

**Правила валидации:**
1. Не пустое
2. Длина ≤ 18 символов
3. Соответствие `/^[A-Za-zА-Яа-я0-9 _.-]+$/`

---

### validateWavelength(wl)

**Назначение:** Валидация длины волны.

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| wl | string|number | Длина волны |

**Возвращает:** `Object`
```javascript
// Успех:
{ valid: true, value: 546.2 }

// Ошибка:
{ valid: false, error: "Неверная длина волны" }
```

**Правила:**
- Диапазон: 190–1100 нм
- Должно быть числом

---

### validateNumeric(value, min, max, fieldName)

**Назначение:** Валидация числового значения с диапазоном.

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| value | string|number | Значение |
| min | number | Минимум |
| max | number | Максимум |
| fieldName | string | Имя поля для ошибки |

**Возвращает:** `Object`
```javascript
// Успех:
{ valid: true, value: 1.5 }

// Ошибка:
{ valid: false, error: "Неверное значение" }
```

---

## Модуль: domain/usecases/utils.js

### clamp(v, min, max)

**Назначение:** Ограничение значения диапазоном.

```javascript
clamp(5, 0, 10)    // 5
clamp(-1, 0, 10)   // 0
clamp(15, 0, 10)   // 10
```

---

### sleep(ms)

**Назначение:** Задержка выполнения.

**Возвращает:** `Promise<void>`

```javascript
await sleep(1000)  // Ждать 1 секунду
```

---

### pad(text, len)

**Назначение:** Дополнение текста пробелами до нужной длины.

```javascript
pad("abc", 5)   // "abc  "
pad("abcdef", 5) // "abcde"
```

---

### center(text, len)

**Назначение:** Центрирование текста.

```javascript
center("abc", 7)  // "  abc  "
center("abcd", 7) // " abcd "
```
