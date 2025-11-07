/**
 * Тесты для валидации платежных карт
 */

import { describe, it, expect } from 'vitest'
import {
  validateLuhn,
  validateCVV,
  validateExpiry,
  validateCard,
  getCardType,
  maskCardNumber
} from '../server/utils/cardValidator'

describe('validateLuhn', () => {
  it('должен принимать валидные номера карт', () => {
    // Тестовые карты Visa
    expect(validateLuhn('4532015112830366')).toBe(true)
    expect(validateLuhn('4556737586899855')).toBe(true)
    
    // Тестовые карты MasterCard
    expect(validateLuhn('5425233430109903')).toBe(true)
    expect(validateLuhn('2221000000000009')).toBe(true)
    
    // Тестовая карта Mir
    expect(validateLuhn('2200000000000004')).toBe(true)
  })
  
  it('должен отклонять невалидные номера карт', () => {
    expect(validateLuhn('1234567890123456')).toBe(false)
    expect(validateLuhn('4532015112830367')).toBe(false) // неверная контрольная цифра
    expect(validateLuhn('0000000000000000')).toBe(false)
  })
  
  it('должен обрабатывать номера с пробелами и дефисами', () => {
    expect(validateLuhn('4532 0151 1283 0366')).toBe(true)
    expect(validateLuhn('4532-0151-1283-0366')).toBe(true)
  })
  
  it('должен отклонять слишком короткие номера', () => {
    expect(validateLuhn('123456789012')).toBe(false)
  })
  
  it('должен отклонять слишком длинные номера', () => {
    expect(validateLuhn('12345678901234567890')).toBe(false)
  })
})

describe('validateCVV', () => {
  it('должен принимать валидные 3-значные CVV', () => {
    expect(validateCVV('123')).toBe(true)
    expect(validateCVV('000')).toBe(true)
    expect(validateCVV('999')).toBe(true)
  })
  
  it('должен принимать валидные 4-значные CVV (AmEx)', () => {
    expect(validateCVV('1234')).toBe(true)
    expect(validateCVV('0000')).toBe(true)
  })
  
  it('должен отклонять невалидные CVV', () => {
    expect(validateCVV('12')).toBe(false)
    expect(validateCVV('12345')).toBe(false)
    expect(validateCVV('')).toBe(false)
    expect(validateCVV('abc')).toBe(false)
  })
})

describe('validateExpiry', () => {
  it('должен принимать валидные даты в будущем', () => {
    // Получаем текущий месяц и год + 1 год
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const month = String(futureDate.getMonth() + 1).padStart(2, '0')
    const year = String(futureDate.getFullYear()).slice(-2)
    
    expect(validateExpiry(`${month}/${year}`)).toBe(true)
  })
  
  it('должен принимать полный формат года', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const month = String(futureDate.getMonth() + 1).padStart(2, '0')
    const year = futureDate.getFullYear()
    
    expect(validateExpiry(`${month}/${year}`)).toBe(true)
  })
  
  it('должен отклонять просроченные даты', () => {
    expect(validateExpiry('01/20')).toBe(false)
    expect(validateExpiry('12/2020')).toBe(false)
  })
  
  it('должен отклонять невалидные месяцы', () => {
    expect(validateExpiry('00/25')).toBe(false)
    expect(validateExpiry('13/25')).toBe(false)
    expect(validateExpiry('99/25')).toBe(false)
  })
  
  it('должен отклонять невалидный формат', () => {
    expect(validateExpiry('12-25')).toBe(false)
    expect(validateExpiry('1225')).toBe(false)
    expect(validateExpiry('invalid')).toBe(false)
  })
})

describe('validateCard', () => {
  it('должен возвращать valid:true для корректных данных', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const month = String(futureDate.getMonth() + 1).padStart(2, '0')
    const year = String(futureDate.getFullYear()).slice(-2)
    
    const result = validateCard(
      '4532015112830366',
      `${month}/${year}`,
      '123'
    )
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
  
  it('должен возвращать ошибки для невалидных данных', () => {
    const result = validateCard(
      '1234567890123456', // невалидный Luhn
      '01/20', // просрочена
      '12' // невалидный CVV
    )
    
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors).toContain('Неверный номер карты')
    expect(result.errors).toContain('Неверный срок действия карты или карта просрочена')
    expect(result.errors).toContain('Неверный CVV/CVC код')
  })
  
  it('должен возвращать только ошибки номера карты', () => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const month = String(futureDate.getMonth() + 1).padStart(2, '0')
    const year = String(futureDate.getFullYear()).slice(-2)
    
    const result = validateCard(
      '1234567890123456',
      `${month}/${year}`,
      '123'
    )
    
    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('номер карты')
  })
})

describe('getCardType', () => {
  it('должен определять Visa', () => {
    expect(getCardType('4532015112830366')).toBe('Visa')
    expect(getCardType('4556737586899855')).toBe('Visa')
  })
  
  it('должен определять MasterCard', () => {
    expect(getCardType('5425233430109903')).toBe('MasterCard')
    expect(getCardType('5105105105105100')).toBe('MasterCard')
  })
  
  it('должен определять Mir', () => {
    expect(getCardType('2200000000000004')).toBe('Mir')
    expect(getCardType('2201382000000013')).toBe('Mir')
  })
  
  it('должен определять American Express', () => {
    expect(getCardType('378282246310005')).toBe('American Express')
    expect(getCardType('371449635398431')).toBe('American Express')
  })
  
  it('должен определять UnionPay', () => {
    expect(getCardType('6200000000000005')).toBe('UnionPay')
  })
  
  it('должен возвращать Unknown для неизвестных типов', () => {
    expect(getCardType('9999999999999999')).toBe('Unknown')
  })
})

describe('maskCardNumber', () => {
  it('должен маскировать номер карты', () => {
    expect(maskCardNumber('4532015112830366')).toBe('**** **** **** 0366')
    expect(maskCardNumber('5425233430109903')).toBe('**** **** **** 9903')
  })
  
  it('должен обрабатывать номера с пробелами', () => {
    expect(maskCardNumber('4532 0151 1283 0366')).toBe('**** **** **** 0366')
  })
  
  it('должен обрабатывать короткие номера', () => {
    expect(maskCardNumber('123')).toBe('****')
  })
})

