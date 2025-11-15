/**
 * Unit tests for PersonalCalculation.vue component
 * Tests edge cases: single applicant, missing extrasMap entries, exact/over/under payments
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import PersonalCalculation from '../components/PersonalCalculation.vue'
import type { EventItem, MonitoringSnapshot, Applicant } from '../types'

// Helper to create mock event
const createMockEvent = (overrides?: Partial<EventItem>): EventItem => ({
  id: 'event-1',
  author: 'author-1',
  title: 'Test Event',
  location: 'Test Location',
  startAt: '2024-01-01T10:00:00Z',
  priceTotal: 10000, // 100.00 in cents
  pricePerSeat: 5000, // 50.00 in cents
  seatLimit: 2,
  controlPlan: ['t0', 'ti10', 'ti20', 'ti30', 'ti40', 'ti50', 't999'],
  status: 'published',
  ...overrides
})

// Helper to create mock snapshot
const createMockSnapshot = (overrides?: Partial<MonitoringSnapshot>): MonitoringSnapshot => ({
  eventId: 'event-1',
  nowPoint: 'ti30',
  collected: 15000, // 150.00 in cents
  surplus: 5000, // 50.00 in cents
  isCancelled: false,
  applicants: [],
  ...overrides
})

// Helper to create mock applicant
const createMockApplicant = (code: string, paidAmount: number, seats: number = 1, overrides?: Partial<Applicant>): Applicant => ({
  code,
  seats,
  paidAmount,
  payments: [{ amount: paidAmount, createdAt: '2024-01-01T10:00:00Z' }],
  ...overrides
})

describe('PersonalCalculation - extrasMap and totalExtras', () => {
  it('should correctly calculate extras for all participants with overpayments', async () => {
    const event = createMockEvent({ pricePerSeat: 5000, seatLimit: 3 })
    const snapshot = createMockSnapshot({
      applicants: [
        createMockApplicant('A', 6000, 1), // paid 60, expected 50, extra = 10
        createMockApplicant('B', 7000, 1), // paid 70, expected 50, extra = 20
        createMockApplicant('C', 5000, 1), // paid 50, expected 50, extra = 0
      ],
      collected: 18000,
      surplus: 8000
    })

    const wrapper = mount(PersonalCalculation, {
      props: {
        event,
        snapshot,
        isOpen: true,
        currentUserCode: 'A'
      }
    })

    await nextTick()
    const result = wrapper.vm.result
    
    // Verify result includes correct extraContribution
    expect(result).not.toBeNull()
    expect(result?.status).toBe('success')
    expect(result?.extraContribution).toBe(1000) // A's extra: 60 - 50 = 10 (in cents, so 1000)
    expect(result?.expectedPayment).toBe(5000)
  })

  it('should correctly calculate extras for participants with underpayments', async () => {
    const event = createMockEvent({ pricePerSeat: 5000, seatLimit: 2 })
    const snapshot = createMockSnapshot({
      applicants: [
        createMockApplicant('A', 4000, 1), // paid 40, expected 50, extra = 0, deficit = 10
        createMockApplicant('B', 3000, 1), // paid 30, expected 50, extra = 0, deficit = 20
      ],
      collected: 7000
    })

    const wrapper = mount(PersonalCalculation, {
      props: {
        event,
        snapshot,
        isOpen: true,
        currentUserCode: 'A'
      }
    })

    await nextTick()
    const result = wrapper.vm.result
    
    expect(result).not.toBeNull()
    expect(result?.status).toBe('success')
    expect(result?.extraContribution).toBe(0)
    expect(result?.deficit).toBe(1000) // 50 - 40 = 10 (in cents, so 1000)
  })

  it('should correctly calculate extras for participants with exact payments', async () => {
    const event = createMockEvent({ pricePerSeat: 5000, seatLimit: 2 })
    const snapshot = createMockSnapshot({
      applicants: [
        createMockApplicant('A', 5000, 1), // paid 50, expected 50, extra = 0
        createMockApplicant('B', 5000, 1), // paid 50, expected 50, extra = 0
      ],
      collected: 10000
    })

    const wrapper = mount(PersonalCalculation, {
      props: {
        event,
        snapshot,
        isOpen: true,
        currentUserCode: 'A'
      }
    })

    await nextTick()
    const result = wrapper.vm.result
    
    expect(result).not.toBeNull()
    expect(result?.status).toBe('success')
    expect(result?.extraContribution).toBe(0)
    expect(result?.deficit).toBe(0)
  })

  it('should correctly calculate extras for participants with multiple seats', async () => {
    const event = createMockEvent({ pricePerSeat: 5000, seatLimit: 2 })
    const snapshot = createMockSnapshot({
      applicants: [
        createMockApplicant('A', 12000, 2), // paid 120, expected 100 (2 seats × 50), extra = 20
        createMockApplicant('B', 5000, 1),   // paid 50, expected 50, extra = 0
      ],
      collected: 17000,
      surplus: 7000
    })

    const wrapper = mount(PersonalCalculation, {
      props: {
        event,
        snapshot,
        isOpen: true,
        currentUserCode: 'A'
      }
    })

    await nextTick()
    const result = wrapper.vm.result
    
    expect(result).not.toBeNull()
    expect(result?.status).toBe('success')
    expect(result?.expectedPayment).toBe(10000) // 2 × 5000
    expect(result?.extraContribution).toBe(2000) // 12000 - 10000
  })
})

describe('PersonalCalculation - share calculation', () => {
  it('should return share = 1 for single applicant when surplus > 0', async () => {
    const event = createMockEvent({ pricePerSeat: 5000, seatLimit: 1 })
    const snapshot = createMockSnapshot({
      applicants: [
        createMockApplicant('A', 6000, 1), // paid 60, expected 50, extra = 10
      ],
      collected: 6000,
      surplus: 1000
    })

    const wrapper = mount(PersonalCalculation, {
      props: {
        event,
        snapshot,
        isOpen: true,
        currentUserCode: 'A'
      }
    })

    await nextTick()
    const result = wrapper.vm.result
    
    expect(result).not.toBeNull()
    expect(result?.status).toBe('success')
    expect(result?.share).toBe(1) // Single applicant gets 100% of surplus
  })

  it('should calculate share proportionally to extraContribution when totalExtras > 0', async () => {
    const event = createMockEvent({ pricePerSeat: 5000, seatLimit: 3 })
    const snapshot = createMockSnapshot({
      applicants: [
        createMockApplicant('A', 6000, 1), // paid 60, expected 50, extra = 10
        createMockApplicant('B', 7000, 1), // paid 70, expected 50, extra = 20
        createMockApplicant('C', 8000, 1), // paid 80, expected 50, extra = 30
      ],
      collected: 21000,
      surplus: 11000 // total collected - priceTotal (210 - 100 = 110, but overflow is 0)
    })

    const wrapper = mount(PersonalCalculation, {
      props: {
        event,
        snapshot,
        isOpen: true,
        currentUserCode: 'A'
      }
    })

    await nextTick()
    const result = wrapper.vm.result
    
    expect(result).not.toBeNull()
    expect(result?.status).toBe('success')
    // totalExtras = 10 + 20 + 30 = 60 (in thousands of cents, so 6000)
    // share for A = 1000 / 6000 = 0.1666...
    expect(result?.share).toBeCloseTo(1000 / 6000, 5)
    expect(result?.extraContribution).toBe(1000)
  })

  it('should distribute share equally when totalExtras = 0 but surplus > 0', async () => {
    const event = createMockEvent({ pricePerSeat: 5000, seatLimit: 2 })
    // Create a scenario where there's surplus but no extras
    // This shouldn't happen in practice, but we test the fallback
    const snapshotWithSurplus = createMockSnapshot({
      applicants: [
        createMockApplicant('A', 5000, 1),
        createMockApplicant('B', 5000, 1),
      ],
      collected: 11000, // Collected more than priceTotal
      surplus: 1000
    })

    const wrapper = mount(PersonalCalculation, {
      props: {
        event,
        snapshot: snapshotWithSurplus,
        isOpen: true,
        currentUserCode: 'A'
      }
    })

    await nextTick()
    const result = wrapper.vm.result
    
    expect(result).not.toBeNull()
    expect(result?.status).toBe('success')
    // When totalExtras = 0, share = 1 / count = 1 / 2 = 0.5
    expect(result?.share).toBe(0.5)
  })

  it('should handle all applicants correctly without missing entries', async () => {
    const event = createMockEvent({ pricePerSeat: 5000, seatLimit: 2 })
    const snapshot = createMockSnapshot({
      applicants: [
        createMockApplicant('A', 6000, 1),
        createMockApplicant('B', 7000, 1),
      ],
      collected: 13000,
      surplus: 3000
    })

    const wrapper = mount(PersonalCalculation, {
      props: {
        event,
        snapshot,
        isOpen: true,
        currentUserCode: 'A'
      }
    })

    await nextTick()
    const result = wrapper.vm.result
    
    // The result should use the extrasMap entry correctly
    expect(result).not.toBeNull()
    expect(result?.status).toBe('success')
    expect(result?.expectedPayment).toBe(5000)
    expect(result?.extraContribution).toBe(1000) // From extrasMap: 6000 - 5000
  })
})

describe('PersonalCalculation - edge cases', () => {
  it('should handle zero totalExtras with single applicant', async () => {
    const event = createMockEvent({ pricePerSeat: 5000, seatLimit: 1 })
    const snapshot = createMockSnapshot({
      applicants: [
        createMockApplicant('A', 5000, 1), // Exact payment, no extra
      ],
      collected: 5000,
      surplus: 0
    })

    const wrapper = mount(PersonalCalculation, {
      props: {
        event,
        snapshot,
        isOpen: true,
        currentUserCode: 'A'
      }
    })

    await nextTick()
    const result = wrapper.vm.result
    
    expect(result).not.toBeNull()
    expect(result?.status).toBe('success')
    // When surplus = 0, share should be 0
    expect(result?.share).toBe(0)
  })

  it('should correctly calculate shares for multiple participants with varying extras', async () => {
    const event = createMockEvent({ pricePerSeat: 10000, seatLimit: 5 })
    const snapshot = createMockSnapshot({
      applicants: [
        createMockApplicant('A', 12000, 1), // extra = 2 (2000)
        createMockApplicant('B', 15000, 1), // extra = 5 (5000)
        createMockApplicant('C', 10000, 1), // extra = 0
        createMockApplicant('D', 11000, 1), // extra = 1 (1000)
        createMockApplicant('E', 13000, 1), // extra = 3 (3000)
      ],
      collected: 61000,
      surplus: 11000
    })

    // Test for participant A
    const wrapperA = mount(PersonalCalculation, {
      props: {
        event,
        snapshot,
        isOpen: true,
        currentUserCode: 'A'
      }
    })

    await nextTick()
    const resultA = wrapperA.vm.result
    
    // totalExtras = 2 + 5 + 0 + 1 + 3 = 11 (in thousands of cents, so 11000)
    // share for A = 2000 / 11000
    expect(resultA?.share).toBeCloseTo(2000 / 11000, 5)
    expect(resultA?.extraContribution).toBe(2000)
    
    // Test for participant C (no extra)
    const wrapperC = mount(PersonalCalculation, {
      props: {
        event,
        snapshot,
        isOpen: true,
        currentUserCode: 'C'
      }
    })

    await nextTick()
    const resultC = wrapperC.vm.result
    
    // C has extra = 0, so when totalExtras > 0, share = 0 / totalExtras = 0
    expect(resultC?.share).toBe(0)
    expect(resultC?.extraContribution).toBe(0)
  })

  it('should handle participants with no payments array', async () => {
    const event = createMockEvent({ pricePerSeat: 5000, seatLimit: 2 })
    const snapshot = createMockSnapshot({
      applicants: [
        { code: 'A', seats: 1, paidAmount: 6000 } as Applicant, // No payments array
        { code: 'B', seats: 1, paidAmount: 7000, payments: [] }, // Empty payments array
      ],
      collected: 13000,
      surplus: 3000
    })

    const wrapper = mount(PersonalCalculation, {
      props: {
        event,
        snapshot,
        isOpen: true,
        currentUserCode: 'A'
      }
    })

    await nextTick()
    const result = wrapper.vm.result
    
    expect(result).not.toBeNull()
    expect(result?.status).toBe('success')
    expect(result?.extraContribution).toBe(1000) // 6000 - 5000
  })
})

