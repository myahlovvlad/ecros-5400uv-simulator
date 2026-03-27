/**
 * Domain entities - основные бизнес-объекты
 */

/**
 * @typedef {Object} Measurement
 * @property {number} index - Номер измерения
 * @property {number} wavelength - Длина волны в нм
 * @property {number} energy - Энергия
 * @property {number} t - Пропускание в %
 * @property {number} a - Оптическая плотность (Abs)
 */

/**
 * @typedef {Object} CalibrationStep
 * @property {string} id - Идентификатор шага
 * @property {string} code - Код стандарта
 * @property {number} standardIndex - Индекс стандарта
 * @property {number} parallelIndex - Индекс параллели
 * @property {number} opInsert - Операция вставки
 * @property {number} opMeasure - Операция измерения
 * @property {string} status - Статус (pending/done)
 * @property {Measurement|null} result - Результат измерения
 */

/**
 * @typedef {Object} DeviceFile
 * @property {string} name - Имя файла
 * @property {string} ext - Расширение
 * @property {boolean} exported - Флаг экспорта
 */

/**
 * @typedef {Object} KineticPoint
 * @property {number} time - Время в секундах
 * @property {number} value - Значение (Abs)
 */

/**
 * @typedef {Object} Warning
 * @property {string} title - Заголовок
 * @property {string} body - Тело сообщения
 */

/**
 * @typedef {Object} CalibrationState
 * @property {number} standards - Количество стандартов
 * @property {number} parallels - Количество параллелей
 * @property {CalibrationStep[]} plan - План измерений
 * @property {number} stepIndex - Текущий шаг
 * @property {number} journalIndex - Индекс журнала
 * @property {boolean} showGraph - Показать график
 */

/**
 * @typedef {Object} FileContext
 * @property {string} group - Группа файлов
 * @property {string} mode - Режим (browse/edit)
 */

/**
 * @typedef {Object} SaveMeta
 * @property {string} group - Группа
 * @property {string} suggestedExt - Предлагаемое расширение
 */

/**
 * @typedef {Object} DeviceState
 * @property {string} screen - Текущий экран
 * @property {string} previousScreen - Предыдущий экран
 * @property {number} mainIndex - Индекс в главном меню
 * @property {number} photometryValueIndex - Индекс величины фотометрии
 * @property {number} quantIndex - Индекс количественного анализа
 * @property {number} kineticsIndex - Индекс кинетики
 * @property {number} unitsIndex - Индекс единиц измерения
 * @property {number} wavelength - Длина волны
 * @property {number} gain - Усиление
 * @property {number} slip - Щель
 * @property {number} sampler - Сэмплер
 * @property {number} lampWL - Длина волны лампы
 * @property {boolean} d2Lamp - D2 лампа включена
 * @property {boolean} wLamp - W лампа включена
 * @property {string} softwareVersion - Версия ПО
 * @property {string} hardwareVersion - Версия железа
 * @property {string} company - Компания
 * @property {string} inputBuffer - Буфер ввода
 * @property {string|null} inputTarget - Цель ввода
 * @property {string} returnScreen - Экран возврата
 * @property {Measurement[]} measurements - Измерения
 * @property {number} measurementCursor - Курсор измерений
 * @property {KineticPoint[]} kineticPoints - Кинетические точки
 * @property {number} kineticDuration - Длительность кинетики
 * @property {number} kineticUpper - Верхняя граница
 * @property {number} kineticLower - Нижняя граница
 * @property {number} quantK - Коэффициент K
 * @property {number} quantB - Коэффициент B
 * @property {number} e100 - Энергия 100%
 * @property {number} lastEnergy - Последняя энергия
 * @property {number} lastComputedA - Последнее вычисленное A
 * @property {number} lastComputedT - Последнее вычисленное T
 * @property {number[]} darkValues - Значения темнового тока
 * @property {boolean} busy - Флаг занятости
 * @property {string} busyLabel - Метка занятости
 * @property {number} diagIndex - Индекс диагностики
 * @property {number} warmupRemaining - Остаток прогрева
 * @property {string} currentSample - Текущий образец
 * @property {string[]} logLines - Строки лога
 * @property {number} fileRootIndex - Индекс корня файлов
 * @property {number} fileListIndex - Индекс списка файлов
 * @property {number} fileActionIndex - Индекс действия с файлом
 * @property {FileContext} fileContext - Контекст файлов
 * @property {Object.<string, DeviceFile[]>} files - Файлы по группам
 * @property {SaveMeta} saveMeta - Метаданные сохранения
 * @property {Warning|null} warning - Предупреждение
 * @property {string} warningReturn - Экран возврата из предупреждения
 * @property {CalibrationState} calibration - Состояние калибровки
 * @property {string} dialogTitle - Заголовок диалога
 * @property {string} dialogBody - Тело диалога
 */
