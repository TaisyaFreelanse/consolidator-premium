/**
 * Тесты для утилиты getNotices()
 */

import { describe, it, expect } from 'vitest'
import { getNotices, getAllNotices, isValidControlPoint } from '../server/utils/getNotices'

describe('getNotices', () => {
  it('должен возвращать извещения для интервала t0-ti10', () => {
    const notices = getNotices('t0', false)
    
    expect(notices).not.toBeNull()
    expect(notices?.notice1).toContain('Опубликовали объявление')
    expect(notices?.notice2).toContain('Начало приема заявок')
  })
  
  it('должен возвращать извещения для интервала ti10-ti20', () => {
    const notices = getNotices('ti10', false)
    
    expect(notices).not.toBeNull()
    expect(notices?.notice1).toContain('Принимаем заявки')
    expect(notices?.notice2).toContain('Окончание приема заявок')
  })
  
  it('должен возвращать извещения для интервала ti20-ti30', () => {
    const notices = getNotices('ti20', false)
    
    expect(notices).not.toBeNull()
    expect(notices?.notice1).toContain('Подводим итоги')
    expect(notices?.notice2).toContain('Объявление результатов')
  })
  
  it('должен возвращать извещения для интервала ti30-ti40 (успешное мероприятие)', () => {
    const notices = getNotices('ti30', false)
    
    expect(notices).not.toBeNull()
    expect(notices?.notice1).toContain('Собрано достаточно средств')
    expect(notices?.notice2).toContain('Начало мероприятия')
  })
  
  it('должен возвращать извещения для интервала ti30-ti40 (отмена)', () => {
    const notices = getNotices('ti30', true)
    
    expect(notices).not.toBeNull()
    expect(notices?.notice1).toContain('недостаточно средств')
    expect(notices?.notice2).toContain('не состоится')
  })
  
  it('должен возвращать извещения для интервала ti40-ti50', () => {
    const notices = getNotices('ti40', false)
    
    expect(notices).not.toBeNull()
    expect(notices?.notice1).toContain('Проводится мероприятие')
    expect(notices?.notice2).toContain('Окончание мероприятия')
  })
  
  it('должен возвращать извещения для интервала ti50-t999', () => {
    const notices = getNotices('ti50', false)
    
    expect(notices).not.toBeNull()
    expect(notices?.notice1).toContain('завершилось')
  })
  
  it('должен возвращать null для последней контрольной точки t999', () => {
    const notices = getNotices('t999', false)
    expect(notices).toBeNull()
  })
  
  it('должен возвращать начальные извещения для null', () => {
    const notices = getNotices(null, false)
    
    expect(notices).not.toBeNull()
    expect(notices?.notice1).toContain('Опубликовали объявление')
  })
  
  it('должен корректно обрабатывать флаг isCancelled', () => {
    const noticesNormal = getNotices('ti30', false)
    const noticesCancelled = getNotices('ti30', true)
    
    expect(noticesNormal?.notice1).not.toBe(noticesCancelled?.notice1)
    expect(noticesCancelled?.notice1).toContain('недостаточно средств')
  })
})

describe('getAllNotices', () => {
  it('должен возвращать все интервалы извещений', () => {
    const allNotices = getAllNotices()
    
    expect(allNotices).toHaveLength(6)
    expect(allNotices[0].interval).toBe('t0-ti10')
    expect(allNotices[5].interval).toBe('ti50-t999')
  })
  
  it('каждый интервал должен содержать notice1 и notice2', () => {
    const allNotices = getAllNotices()
    
    allNotices.forEach(item => {
      expect(item.notices).toHaveProperty('notice1')
      expect(item.notices).toHaveProperty('notice2')
      expect(item.notices).toHaveProperty('notice1Cancelled')
      expect(item.notices).toHaveProperty('notice2Cancelled')
    })
  })
})

describe('isValidControlPoint', () => {
  it('должен валидировать корректные контрольные точки', () => {
    expect(isValidControlPoint('t0')).toBe(true)
    expect(isValidControlPoint('ti10')).toBe(true)
    expect(isValidControlPoint('ti20')).toBe(true)
    expect(isValidControlPoint('ti30')).toBe(true)
    expect(isValidControlPoint('ti40')).toBe(true)
    expect(isValidControlPoint('ti50')).toBe(true)
    expect(isValidControlPoint('t999')).toBe(true)
  })
  
  it('должен отклонять некорректные контрольные точки', () => {
    expect(isValidControlPoint('t1')).toBe(false)
    expect(isValidControlPoint('ti60')).toBe(false)
    expect(isValidControlPoint('invalid')).toBe(false)
    expect(isValidControlPoint('')).toBe(false)
  })
})

