/**
 * Утилиты для валидации платежных карт
 * Виртуальная имитация для тестирования без реальной интеграции с ЮKassa
 */

/**
 * Проверка номера карты по алгоритму Luhn
 * @param cardNumber - номер карты (только цифры)
 * @returns true если номер валиден
 */
export function validateLuhn(cardNumber: string): boolean {
  // Убираем все нецифровые символы
  const cleaned = cardNumber.replace(/\D/g, '')
  
  // Минимум 13 цифр, максимум 19
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false
  }
  
  let sum = 0
  let isEven = false
  
  // Проходим по цифрам справа налево
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10)
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

/**
 * Проверка CVV/CVC кода
 * @param cvv - код CVV/CVC
 * @returns true если код валиден
 */
export function validateCVV(cvv: string): boolean {
  const cleaned = cvv.replace(/\D/g, '')
  return cleaned.length === 3 || cleaned.length === 4
}

/**
 * Проверка срока действия карты
 * @param expiry - срок действия в формате MM/YY или MM/YYYY
 * @returns true если карта не просрочена
 */
export function validateExpiry(expiry: string): boolean {
  // Парсим MM/YY или MM/YYYY
  const parts = expiry.split('/')
  if (parts.length !== 2) {
    return false
  }
  
  const month = parseInt(parts[0], 10)
  let year = parseInt(parts[1], 10)
  
  // Валидация месяца
  if (month < 1 || month > 12) {
    return false
  }
  
  // Приводим год к полному формату
  if (year < 100) {
    year += 2000
  }
  
  // Проверяем, что карта не просрочена
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // getMonth() возвращает 0-11
  
  if (year < currentYear) {
    return false
  }
  
  if (year === currentYear && month < currentMonth) {
    return false
  }
  
  return true
}

/**
 * Полная валидация карты
 * В тестовом режиме всегда возвращает успех (все карты проходят)
 * @param cardNumber - номер карты
 * @param expiry - срок действия MM/YY
 * @param cvv - CVV код
 * @returns объект с результатом валидации и ошибками
 */
export function validateCard(
  cardNumber: string,
  expiry: string,
  cvv: string
): { valid: boolean; errors: string[] } {
  // В тестовом режиме все карты проходят как успешные
  // Нет смысла проверять реальные данные карт для тестовой оплаты
  return {
    valid: true,
    errors: []
  }
}

/**
 * Определить тип платежной системы по номеру карты
 * @param cardNumber - номер карты
 * @returns тип платежной системы
 */
export function getCardType(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')
  
  if (/^4/.test(cleaned)) return 'Visa'
  if (/^5[1-5]/.test(cleaned)) return 'MasterCard'
  if (/^2/.test(cleaned)) return 'Mir'
  if (/^3[47]/.test(cleaned)) return 'American Express'
  if (/^6/.test(cleaned)) return 'UnionPay'
  
  return 'Unknown'
}

/**
 * Маскировать номер карты для безопасного отображения
 * @param cardNumber - номер карты
 * @returns замаскированный номер (например: **** **** **** 1234)
 */
export function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')
  if (cleaned.length < 4) {
    return '****'
  }
  
  const last4 = cleaned.slice(-4)
  return `**** **** **** ${last4}`
}

