
# Консолидатор — Stage 1 (Desktop-first, Premium UI)

**Готовый MVP-фронтенд (Nuxt 3 + Tailwind + Pinia)** для страниц: Каталог, Избранное, Мониторинг.
- Мок-данные в `/public/mock`
- Переходы и состояния реализованы
- Премиум-оболочка: стеклянные карточки, плавные тени, бренд‑цвета

## Запуск
```bash
npm i
npm run dev
```

Откройте: http://localhost:3000/catalog

## Что дальше (Stage 2→4)
- ЮKassa (test): backend endpoints, webhooks (без реальных платежей)
- Логика контрольных точек, статусы, уведомления
- Расчёт профицит/дефицит и сценарии возвратов (пропорционально)

## Структура
- `/pages` — catalog, favorites, monitoring
- `/components` — EventCard, ControlPointsBar, MonitoringTable
- `/stores` — events, favorites, monitoring
- `/types` — типы сущностей
