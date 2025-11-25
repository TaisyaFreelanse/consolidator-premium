 Мини-ТЗ для reg.ru: развертывание основного сайта

Документ для службы поддержки reg.ru с просьбой развернуть основной сайт (без демо-платформы) из GitHub-репозитория.

 1. Что нужно сделать
- Клонировать production-ветку `main` репозитория "https://github.com/TaisyaFreelanse/consolidator-premium".
- Подготовить серверное окружение и запустить основной Nuxt-приложение (Nuxt 3 + Node.js, SSR mode).
- Настроить PostgreSQL базу и применить все миграции Prisma.
- Собрать и запустить приложение в режиме `npm run build` → `npm run start`.
- Обеспечить автозапуск сервиса (systemd/pm2) и доступ по HTTPS.

 2. Серверное окружение
- ОС: Ubuntu 22.04 LTS (или совместимая).
- Node.js 20.x, npm 10.x (установить через NodeSource или nvm).
- PostgreSQL 15+ (отдельная БД для проекта, UTF-8).
- Git 2.34+.
- Процесс-менеджер: systemd (предпочтительно) либо pm2.

 3. Подготовка проекта
1. Клонировать репозиторий:
   bash
   git clone https://github.com/.../consolidator-premium.git /var/www/consolidator
   cd /var/www/consolidator
   git checkout main
   
2. Установить зависимости:
   bash
   npm install --omit=dev
   
3. Создать `.env` в корне (значения выдать в ответном письме):
   env
   NODE_ENV=production
   DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<db>?schema=public"
   AUTO_MODERATION_ENABLED=false
   
4. Сгенерировать Prisma Client и применить миграции:
   bash
   npx prisma generate
   npx prisma migrate deploy
   
5. Заполнить базу начальными данными (по необходимости):
   bash
   npx prisma db seed
   

 4. Сборка и запуск
bash
npm run build
npm run start -- --port 3000

- Пробросить 80/443 → 3000 (reverse proxy nginx/traefik).
- Запустить через systemd (пример службы предоставить по факту развертывания).

 5. Ограничения
- Не публиковать демо-страницы `pages/demo/*`.
- Приложение использует только основной фронт/бэкенд. Любые дополнительные поддомены отключить.
- В логи не должны попадать секреты `.env`.

 6. Что нужно подтвердить после развертывания
- URL основного сайта доступен по HTTPS.
- API `/api/events` и `/api/monitoring/{eventId}` отвечают 200.
- Выполнена автоматическая инициализация БД (логи `server/plugins/init-database.ts`).
- Процесс добавлен в автозагрузку.

Просьба сообщить по завершению: фактический домен, IP сервера, параметры systemd/pm2, использованный PostgreSQL DSN и любые отклонения от этого ТЗ.

