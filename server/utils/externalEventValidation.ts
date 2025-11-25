/**
 * Валидация данных для внешнего API создания/обновления событий
 */

export interface ValidationError {
  field: string
  message: string
}

export interface ExternalEventData {
  id?: string
  title: string
  authorName: string
  location: string
  seatLimit: number
  pricePerSeat: number
  startApplicationsAt: string // ISO datetime
  endApplicationsAt: string // ISO datetime
  startContractsAt: string // ISO datetime
  startAt: string // ISO datetime
  endAt: string // ISO datetime
  createdAtClient: string // ISO datetime
  timezone: string // IANA timezone identifier
  producerCode?: string // Опционально, так как берется из API ключа
  producerName?: string // Опционально, может быть получено из producerCode или оставлено пустым
  description: string
}

/**
 * Проверка валидности IANA timezone идентификатора
 * Используем простую проверку через Intl.DateTimeFormat
 */
function isValidIANATimezone(timezone: string): boolean {
  try {
    // Пытаемся создать объект с указанным timezone
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone })
    // Проверяем, что timezone действительно используется
    formatter.format(new Date())
    return true
  } catch {
    return false
  }
}

/**
 * Валидация всех обязательных полей и правил
 */
export function validateExternalEvent(
  data: Partial<ExternalEventData>,
  options?: { skipProducerCode?: boolean }
): ValidationError[] {
  const errors: ValidationError[] = []

  // 1. Проверка обязательных полей
  const requiredFields: Array<keyof ExternalEventData> = [
    'title',
    'authorName',
    'location',
    'seatLimit',
    'pricePerSeat',
    'startApplicationsAt',
    'endApplicationsAt',
    'startContractsAt',
    'startAt',
    'endAt',
    'createdAtClient',
    'timezone',
    'description'
  ]
  // producerName теперь опционально (может быть получено из producerCode или оставлено пустым)

  // producerCode теперь опционально (берется из API ключа)
  if (!options?.skipProducerCode && data.producerCode === undefined) {
    // Это поле больше не требуется, но оставляем для обратной совместимости
  }

  for (const field of requiredFields) {
    const value = data[field]
    if (value === undefined || value === null || value === '') {
      errors.push({
        field,
        message: `Поле "${field}" обязательно для заполнения`
      })
    }
  }

  // Если отсутствуют обязательные поля, прекращаем дальнейшую валидацию
  if (errors.length > 0) {
    return errors
  }

  // 2. Валидация числовых полей
  const seatLimit = Number(data.seatLimit)
  if (!Number.isInteger(seatLimit) || seatLimit <= 0) {
    errors.push({
      field: 'seatLimit',
      message: 'Количество участников должно быть целым числом больше 0'
    })
  }

  const pricePerSeat = Number(data.pricePerSeat)
  if (!Number.isFinite(pricePerSeat) || pricePerSeat <= 0) {
    errors.push({
      field: 'pricePerSeat',
      message: 'Цена за место должна быть положительным числом'
    })
  }

  // 3. Валидация строковых полей (непустые после тримминга)
  const stringFields: Array<keyof ExternalEventData> = [
    'title',
    'authorName',
    'location',
    'description'
  ]
  // producerName опционально, поэтому не проверяем его здесь

  for (const field of stringFields) {
    const value = String(data[field] || '').trim()
    if (value.length === 0) {
      errors.push({
        field,
        message: `Поле "${field}" не может быть пустым`
      })
    }
  }

  // 4. Валидация timezone (IANA identifier)
  if (data.timezone && !isValidIANATimezone(data.timezone)) {
    errors.push({
      field: 'timezone',
      message: `Некорректный идентификатор часового пояса. Используйте IANA формат (например, "Europe/Moscow", "Asia/Sakhalin")`
    })
  }

  // 5. Валидация дат (ISO 8601) и их последовательности
  const dates: Record<string, Date | null> = {}
  const dateFields = [
    { key: 't0', value: data.createdAtClient, label: 'Создание (t0)' },
    { key: 'ti10', value: data.startApplicationsAt, label: 'Начало приема заявок (ti10)' },
    { key: 'ti20', value: data.endApplicationsAt, label: 'Окончание приема заявок (ti20)' },
    { key: 'ti30', value: data.startContractsAt, label: 'Начало оформления договоров (ti30)' },
    { key: 'ti40', value: data.startAt, label: 'Начало мероприятия (ti40)' },
    { key: 'ti50', value: data.endAt, label: 'Окончание мероприятия (ti50)' }
  ]

  for (const { key, value, label } of dateFields) {
    if (!value) {
      errors.push({
        field: key,
        message: `Поле "${label}" обязательно`
      })
      dates[key] = null
      continue
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      errors.push({
        field: key,
        message: `Некорректный формат даты для "${label}". Используйте ISO 8601 (например, "2025-02-01T09:00:00+03:00")`
      })
      dates[key] = null
    } else {
      dates[key] = date
    }
  }

  // 6. Проверка последовательности контрольных точек
  // t0 < ti10 < ti20 < ti30 < ti40 < ti50
  const sequence = [
    { key: 't0', next: 'ti10' },
    { key: 'ti10', next: 'ti20' },
    { key: 'ti20', next: 'ti30' },
    { key: 'ti30', next: 'ti40' },
    { key: 'ti40', next: 'ti50' }
  ]

  for (const { key, next } of sequence) {
    const current = dates[key]
    const nextDate = dates[next]

    if (current && nextDate && current >= nextDate) {
      const currentLabel = dateFields.find(f => f.key === key)?.label || key
      const nextLabel = dateFields.find(f => f.key === next)?.label || next
      errors.push({
        field: next,
        message: `${nextLabel} должно быть позже ${currentLabel}`
      })
    }
  }

  return errors
}

// Функция isTi20Passed перенесена в server/utils/moderationTimeRestrictions.ts
// для централизованного управления временными ограничениями модерации

