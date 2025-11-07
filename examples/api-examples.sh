#!/bin/bash

# API Examples для consolidator-premium
# Full-Stack Integration: Frontend + Backend

BASE_URL="http://localhost:3000/api"

echo "=========================================="
echo "Примеры использования API"
echo "=========================================="
echo ""
echo "📌 НОВЫЕ ЭНДПОИНТЫ (Frontend Integration)"
echo "=========================================="
echo ""

# 0A. Получить все события
echo "0A️⃣  GET /api/events (все опубликованные события)"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/events" \
  -H "Content-Type: application/json" \
  | jq .

echo ""
echo ""

# 0B. Получить одно событие по ID
echo "0B️⃣  GET /api/events/:id (одно событие)"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/events/ev_test_early" \
  -H "Content-Type: application/json" \
  | jq .

echo ""
echo ""

# 0C. Получить данные мониторинга
echo "0C️⃣  GET /api/monitoring/:eventId (данные мониторинга)"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/monitoring/ev_test_early" \
  -H "Content-Type: application/json" \
  | jq .

echo ""
echo ""

# 0D. Создать заявку с оплатой
echo "0D️⃣  POST /api/applications/create (подать заявку)"
echo "----------------------------------------"
curl -X POST "${BASE_URL}/applications/create" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "ev_test_early",
    "userId": "USER_TEST_999",
    "cardNumber": "4532015112830366",
    "expiry": "12/25",
    "cvc": "123",
    "amount": 500
  }' \
  | jq .

echo ""
echo ""
echo "=========================================="
echo "📌 STAGE 2 ЭНДПОИНТЫ (Control Points & Payments)"
echo "=========================================="
echo ""

# 1. Получить контрольные точки мероприятия
echo "1️⃣  GET /api/events/:id/control-points"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/events/ev_test_early/control-points" \
  -H "Content-Type: application/json" \
  | jq .

echo ""
echo ""

# 2. Обновить контрольную точку (начало приема заявок)
echo "2️⃣  PUT /api/events/:id/control-point (ti10 - начало приема заявок)"
echo "----------------------------------------"
curl -X PUT "${BASE_URL}/events/ev_test_early/control-point" \
  -H "Content-Type: application/json" \
  -d '{
    "currentControlPoint": "ti10",
    "isCancelled": false,
    "note": "Начался прием заявок на мероприятие"
  }' \
  | jq .

echo ""
echo ""

# 3. Имитация успешного платежа (Visa)
echo "3️⃣  POST /api/payments/simulate (Успешный платеж - Visa)"
echo "----------------------------------------"
curl -X POST "${BASE_URL}/payments/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "ev_test_early",
    "userId": "user_test_123",
    "cardNumber": "4532015112830366",
    "expiry": "12/25",
    "cvc": "123",
    "amount": 10000,
    "currency": "RUB"
  }' \
  | jq .

echo ""
echo ""

# 4. Имитация успешного платежа (MasterCard)
echo "4️⃣  POST /api/payments/simulate (Успешный платеж - MasterCard)"
echo "----------------------------------------"
curl -X POST "${BASE_URL}/payments/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "ev_test_early",
    "userId": "user_test_456",
    "cardNumber": "5425233430109903",
    "expiry": "03/26",
    "cvc": "456",
    "amount": 5000,
    "currency": "RUB"
  }' \
  | jq .

echo ""
echo ""

# 5. Имитация платежа с ошибкой валидации (невалидная карта)
echo "5️⃣  POST /api/payments/simulate (Ошибка: невалидная карта)"
echo "----------------------------------------"
curl -X POST "${BASE_URL}/payments/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "ev_test_early",
    "userId": "user_test_789",
    "cardNumber": "1234567890123456",
    "expiry": "12/25",
    "cvc": "123",
    "amount": 1000,
    "currency": "RUB"
  }' \
  | jq .

echo ""
echo ""

# 6. Имитация платежа с просроченной картой
echo "6️⃣  POST /api/payments/simulate (Ошибка: просроченная карта)"
echo "----------------------------------------"
curl -X POST "${BASE_URL}/payments/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "ev_test_early",
    "userId": "user_test_101",
    "cardNumber": "4532015112830366",
    "expiry": "01/20",
    "cvc": "123",
    "amount": 1000,
    "currency": "RUB"
  }' \
  | jq .

echo ""
echo ""

# 7. Закрытие приема заявок (ti20)
echo "7️⃣  PUT /api/events/:id/control-point (ti20 - закрытие приема заявок)"
echo "----------------------------------------"
curl -X PUT "${BASE_URL}/events/ev_test_early/control-point" \
  -H "Content-Type: application/json" \
  -d '{
    "currentControlPoint": "ti20",
    "isCancelled": false,
    "note": "Прием заявок завершен, начинается калькуляция"
  }' \
  | jq .

echo ""
echo ""

# 8. Проверка извещений после закрытия приема заявок
echo "8️⃣  GET /api/events/:id/control-points (проверка извещений ti20)"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/events/ev_test_early/control-points" \
  -H "Content-Type: application/json" \
  | jq .

echo ""
echo ""

# 9. Отмена мероприятия (недостаточно средств)
echo "9️⃣  PUT /api/events/:id/control-point (отмена мероприятия)"
echo "----------------------------------------"
curl -X PUT "${BASE_URL}/events/ev_test_early/control-point" \
  -H "Content-Type: application/json" \
  -d '{
    "currentControlPoint": "ti30",
    "isCancelled": true,
    "note": "Недостаточно средств для проведения мероприятия"
  }' \
  | jq .

echo ""
echo ""

# 10. Проверка извещений после отмены
echo "🔟 GET /api/events/:id/control-points (извещения после отмены)"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/events/ev_test_early/control-points" \
  -H "Content-Type: application/json" \
  | jq .

echo ""
echo ""
echo "=========================================="
echo "✅ Все примеры выполнены!"
echo "=========================================="

