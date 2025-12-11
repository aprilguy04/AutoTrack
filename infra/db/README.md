# Database Infrastructure

Здесь будут храниться:
- SQL скрипты для инициализации БД
- Скрипты для резервного копирования
- Документация по структуре БД

## Текущая структура

База данных управляется через Prisma ORM. Схема находится в `apps/backend/prisma/schema.prisma`.

## Миграции

Миграции создаются и применяются через Prisma:
```bash
cd apps/backend
npm run db:migrate
```

Файлы миграций хранятся в `apps/backend/prisma/migrations/`.
