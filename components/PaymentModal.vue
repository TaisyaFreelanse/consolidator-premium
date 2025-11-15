<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  isOpen: boolean
  initialAmount: number // в рублях
  eventTitle?: string
  mode?: 'application' | 'additional' // режим: заявка или доп. оплата
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'application'
})

const emit = defineEmits<{
  close: []
  submit: [paymentData: { amount: number, cardNumber: string, expiry: string, cvc: string }]
}>()

const overlayRef = ref<HTMLDivElement | null>(null)

// Сумма оплаты (в рублях)
const paymentAmount = ref(0)

// Данные карты
const cardNumber = ref('')
const expiry = ref('')
const cvc = ref('')

const TEST_CARD = {
  number: '5559 0000 0000 0008',
  expiry: '12/34',
  cvc: '000'
}

// При открытии модалки инициализируем сумму и очищаем поля карты
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    paymentAmount.value = props.mode === 'additional' ? 0 : props.initialAmount
    cardNumber.value = TEST_CARD.number
    expiry.value = TEST_CARD.expiry
    cvc.value = TEST_CARD.cvc

    requestAnimationFrame(() => {
      overlayRef.value?.focus()
    })
  }
})

// Форматирование суммы
const formatMoney = (amount: number) => {
  return amount.toLocaleString('ru-RU', { minimumFractionDigits: 0 })
}

// Форматирование номера карты (добавляем пробелы)
const formatCardNumber = () => {
  const cleaned = cardNumber.value.replace(/\s/g, '')
  const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned
  cardNumber.value = formatted.slice(0, 19) // 16 цифр + 3 пробела
}

// Форматирование даты истечения (MM/YY)
const formatExpiry = () => {
  let cleaned = expiry.value.replace(/\D/g, '')
  if (cleaned.length >= 2) {
    cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4)
  }
  expiry.value = cleaned
}

// Валидация
const isValid = computed(() => {
  const minAmount = props.mode === 'application' ? Math.max(props.initialAmount, 1) : 1
  const isAmountValid = paymentAmount.value >= minAmount && paymentAmount.value > 0
  const isCardValid = cardNumber.value.replace(/\s/g, '').length === 16
  const isExpiryValid = expiry.value.length === 5 && expiry.value.includes('/')
  const isCvcValid = cvc.value.length === 3
  
  return isAmountValid && isCardValid && isExpiryValid && isCvcValid
})

// Закрыть модальное окно
const close = () => {
  emit('close')
}

// Подтвердить оплату
const handleSubmit = () => {
  if (!isValid.value) return
  
  // Отправляем данные для оплаты
  emit('submit', {
    amount: paymentAmount.value, // в рублях
    cardNumber: cardNumber.value.replace(/\s/g, ''), // убираем пробелы
    expiry: expiry.value,
    cvc: cvc.value
  })
}

</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        ref="overlayRef"
        tabindex="-1"
        @click.self="close"
        @keydown.esc.prevent.stop="close"
      >
        <div class="modal-container">
          <div class="modal-header">
            <div class="header-icon">
              <svg v-if="mode === 'application'" class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/>
              </svg>
            </div>
            <h2 class="modal-title">
              {{ mode === 'application' ? 'Подать заявку с оплатой' : 'Дополнительная оплата' }}
            </h2>
            <p v-if="eventTitle" class="modal-subtitle">{{ eventTitle }}</p>
            <button class="close-btn" @click="close" title="Закрыть">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <!-- Информация о минимальной сумме -->
            <div class="info-block">
              <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div class="info-text">
                <template v-if="mode === 'application'">
                  <strong>Минимальная сумма взноса:</strong> {{ formatMoney(initialAmount) }} ₽
                  <br>
                  Вы можете внести больше, чтобы повысить свои шансы попасть в число участников
                </template>
                <template v-else>
                  <strong>Введите сумму доплаты вручную.</strong>
                  <br>
                  Укажите любое значение в рублях, чтобы скорректировать свою ставку.
                </template>
              </div>
            </div>

            <!-- Поле ввода суммы -->
            <div class="amount-input-group">
              <label class="input-label">
                {{ mode === 'application' ? 'Сумма взноса' : 'Сумма доплаты' }}
              </label>
              <div class="input-wrapper">
                <input 
                  v-model.number="paymentAmount" 
                  type="number" 
                  :min="mode === 'application' ? initialAmount : 1"
                  step="1"
                  class="amount-input"
                  :class="{ invalid: !isValid }"
                  placeholder="Введите сумму"
                >
                <span class="currency">₽</span>
              </div>
              <p v-if="!isValid && paymentAmount > 0" class="error-text">
                {{ mode === 'application' ? `Сумма не может быть меньше ${formatMoney(initialAmount)} ₽` : 'Сумма доплаты должна быть больше 0 ₽' }}
              </p>
            </div>

            <!-- Данные карты -->
            <div class="card-details">
              <h3 class="section-title">Данные карты</h3>
              
              <div class="form-group">
                <label class="form-label">Номер карты</label>
                <input 
                  v-model="cardNumber" 
                  @input="formatCardNumber"
                  type="text" 
                  class="form-input"
                  placeholder="1234 5678 9012 3456"
                  maxlength="19"
                >
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Срок (MM/YY)</label>
                  <input 
                    v-model="expiry" 
                    @input="formatExpiry"
                    type="text" 
                    class="form-input"
                    placeholder="12/25"
                    maxlength="5"
                  >
                </div>
                <div class="form-group">
                  <label class="form-label">CVV</label>
                  <input 
                    v-model="cvc" 
                    type="text" 
                    class="form-input"
                    placeholder="123"
                    maxlength="3"
                  >
                </div>
              </div>
            </div>

            <!-- Итоговая сумма -->
            <div class="total-block">
              <div class="total-label">К оплате:</div>
              <div class="total-amount">{{ formatMoney(paymentAmount) }} ₽</div>
            </div>

            <!-- Важная информация -->
            <div class="warning-block">
              <svg class="warning-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              <div class="warning-text">
                <strong>Важно!</strong> После нажатия кнопки "Оплатить" вы будете перенаправлены на страницу оплаты. 
                Ваша заявка станет действительной только после успешной оплаты.
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="cancel-btn" @click="close">
              Отмена
            </button>
            <button 
              class="submit-btn" 
              :disabled="!isValid"
              @click="handleSubmit"
            >
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
              Оплатить {{ formatMoney(paymentAmount) }} ₽
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

/* Container */
.modal-container {
  position: relative;
  width: 100%;
  max-width: 480px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 20px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

/* Header */
.modal-header {
  position: relative;
  padding: 20px 24px 16px;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  text-align: center;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.header-icon .icon {
  width: 24px;
  height: 24px;
  color: #fff;
}

.modal-title {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 6px 0;
  letter-spacing: -0.5px;
}

.modal-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  font-weight: 500;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.close-btn .icon {
  width: 20px;
  height: 20px;
}

/* Body */
.modal-body {
  padding: 20px 24px;
}

/* Info Block */
.info-block {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: rgba(0, 122, 255, 0.1);
  border: 2px solid rgba(0, 122, 255, 0.3);
  border-radius: 10px;
  margin-bottom: 16px;
}

.info-icon {
  width: 24px;
  height: 24px;
  color: #007AFF;
  flex-shrink: 0;
  margin-top: 2px;
}

.info-text {
  flex: 1;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
}

.info-text strong {
  color: #fff;
  font-weight: 600;
}

/* Amount Input */
.amount-input-group {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 10px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.amount-input {
  flex: 1;
  width: 100%;
  padding: 12px 45px 12px 16px;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  outline: none;
  transition: all 0.2s;
}

.amount-input:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
}

.amount-input.invalid {
  border-color: #ff3b30;
}

.amount-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.currency {
  position: absolute;
  right: 16px;
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
}

.error-text {
  margin: 8px 0 0 0;
  font-size: 13px;
  color: #ff3b30;
  font-weight: 500;
}

/* Total Block */
.total-block {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  border-radius: 10px;
  margin-bottom: 16px;
}

.total-label {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.total-amount {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -1px;
}

/* Warning Block */
.warning-block {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: rgba(255, 149, 0, 0.1);
  border: 2px solid rgba(255, 149, 0, 0.3);
  border-radius: 8px;
  margin-bottom: 0;
}

.warning-icon {
  width: 20px;
  height: 20px;
  color: #ff9500;
  flex-shrink: 0;
  margin-top: 2px;
}

.warning-text {
  flex: 1;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.85);
}

.warning-text strong {
  color: #ff9500;
  font-weight: 600;
}

/* Card Details */
.card-details {
  margin-bottom: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 12px 0;
}

.form-group {
  margin-bottom: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 15px;
  font-weight: 500;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  outline: none;
  transition: all 0.2s;
}

.form-input:focus {
  background: rgba(255, 255, 255, 0.15);
  border-color: #007AFF;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

/* Footer */
.modal-footer {
  display: flex;
  gap: 10px;
  padding: 16px 24px 20px;
}

.cancel-btn,
.submit-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.submit-btn {
  background: linear-gradient(135deg, #34c759 0%, #30d158 100%);
  border: none;
  color: #fff;
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(52, 199, 89, 0.4);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn .icon {
  width: 20px;
  height: 20px;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
  opacity: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    border-radius: 20px;
  }

  .modal-header {
    padding: 24px 24px 20px;
  }

  .header-icon {
    width: 56px;
    height: 56px;
    margin-bottom: 12px;
  }

  .header-icon .icon {
    width: 28px;
    height: 28px;
  }

  .modal-title {
    font-size: 20px;
  }

  .modal-body {
    padding: 24px;
  }

  .amount-input {
    font-size: 20px;
    padding: 14px 45px 14px 16px;
  }

  .currency {
    font-size: 20px;
    right: 16px;
  }

  .total-amount {
    font-size: 28px;
  }

  .modal-footer {
    flex-direction: column;
    padding: 20px 24px 24px;
  }

  .cancel-btn,
  .submit-btn {
    padding: 14px 20px;
    font-size: 15px;
  }
}
</style>

