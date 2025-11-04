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
  submit: [amount: number]
}>()

// Сумма оплаты (в рублях)
const paymentAmount = ref(0)

// При открытии модалки инициализируем сумму
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    paymentAmount.value = props.initialAmount
  }
})

// Форматирование суммы
const formatMoney = (amount: number) => {
  return amount.toLocaleString('ru-RU', { minimumFractionDigits: 0 })
}

// Валидация
const isValid = computed(() => {
  return paymentAmount.value >= props.initialAmount && paymentAmount.value > 0
})

// Закрыть модальное окно
const close = () => {
  emit('close')
}

// Подтвердить оплату
const handleSubmit = () => {
  if (!isValid.value) return
  
  // Конвертируем рубли в копейки для отправки
  emit('submit', Math.round(paymentAmount.value * 100))
  close()
}

// Быстрые кнопки увеличения суммы
const quickIncrease = (percent: number) => {
  paymentAmount.value = Math.round(paymentAmount.value * (1 + percent / 100))
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="close">
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
                  <strong>Рекомендуемая доплата:</strong> {{ formatMoney(initialAmount) }} ₽
                  <br>
                  Увеличьте свою ставку, чтобы подняться в рейтинге участников
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
                  :min="initialAmount"
                  step="100"
                  class="amount-input"
                  :class="{ invalid: !isValid }"
                  placeholder="Введите сумму"
                >
                <span class="currency">₽</span>
              </div>
              <p v-if="!isValid && paymentAmount > 0" class="error-text">
                Сумма не может быть меньше {{ formatMoney(initialAmount) }} ₽
              </p>
            </div>

            <!-- Быстрые кнопки увеличения -->
            <div class="quick-buttons">
              <button 
                type="button"
                class="quick-btn" 
                @click="quickIncrease(10)"
              >
                +10%
              </button>
              <button 
                type="button"
                class="quick-btn" 
                @click="quickIncrease(25)"
              >
                +25%
              </button>
              <button 
                type="button"
                class="quick-btn" 
                @click="quickIncrease(50)"
              >
                +50%
              </button>
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
  max-width: 560px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 24px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

/* Header */
.modal-header {
  position: relative;
  padding: 32px 32px 24px;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  text-align: center;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.header-icon .icon {
  width: 32px;
  height: 32px;
  color: #fff;
}

.modal-title {
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 8px 0;
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
  padding: 32px;
}

/* Info Block */
.info-block {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(0, 122, 255, 0.1);
  border: 2px solid rgba(0, 122, 255, 0.3);
  border-radius: 12px;
  margin-bottom: 24px;
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
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}

.info-text strong {
  color: #fff;
  font-weight: 600;
}

/* Amount Input */
.amount-input-group {
  margin-bottom: 20px;
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
  padding: 16px 50px 16px 20px;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
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
  right: 20px;
  font-size: 24px;
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

/* Quick Buttons */
.quick-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.quick-btn {
  flex: 1;
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #007AFF;
  transform: translateY(-2px);
}

/* Total Block */
.total-block {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  border-radius: 12px;
  margin-bottom: 20px;
}

.total-label {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.total-amount {
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -1px;
}

/* Warning Block */
.warning-block {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: rgba(255, 149, 0, 0.1);
  border: 2px solid rgba(255, 149, 0, 0.3);
  border-radius: 10px;
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

/* Footer */
.modal-footer {
  display: flex;
  gap: 12px;
  padding: 24px 32px 32px;
}

.cancel-btn,
.submit-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 700;
  border-radius: 12px;
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

