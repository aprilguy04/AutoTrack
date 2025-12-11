# AutoTrack Backend

Backend API для системы отслеживания прогресса ремонта автомобилей.

## Технологический стек

- **Node.js 20+** + **TypeScript**
- **Express** — веб-фреймворк
- **Prisma** — ORM для работы с MS SQL Server
- **MS SQL Server** — база данных
- **Zod** — валидация данных

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка базы данных

1. Создайте файл `.env` в корне проекта (см. `ENV_SETUP.md`)
2. Укажите параметры подключения к MS SQL Server:
   ```env
   DATABASE_URL="sqlserver://localhost:1433;database=autotrack_dev;user=sa;password=YourPassword;encrypt=false;trustServerCertificate=true"
   ```

3. Создайте базу данных в SQL Server:
   ```sql
   CREATE DATABASE autotrack_dev;
   ```

### 3. Инициализация базы данных

```bash
# Генерация Prisma Client
npm run db:generate

# Создание и применение миграций
npm run db:migrate

# Заполнение тестовыми данными (опционально)
npm run db:seed
```

### 4. Запуск

```bash
# Режим разработки (с hot reload)
npm run dev

# Production build
npm run build
npm start
```

## Структура проекта

```
src/
├── config/          # Конфигурация (env, constants)
├── db/              # Prisma client и подключение к БД
├── modules/         # Модули приложения
│   ├── auth/        # Аутентификация
│   ├── catalog/     # Каталог услуг и комплектующих
│   ├── orders/      # Заказы
│   ├── progress/    # Отслеживание прогресса
│   └── notifications/ # Уведомления
├── routes/          # Регистрация маршрутов
└── main.ts          # Точка входа

prisma/
├── schema.prisma    # Схема базы данных
├── seed.ts          # Скрипт заполнения тестовыми данными
└── migrations/      # Миграции БД (создаются автоматически)
```

## Работа с базой данных

### Миграции

Схема БД спроектирована для частых изменений. При изменении `schema.prisma`:

```bash
# Создать и применить миграцию
npm run db:migrate

# В production
npm run db:migrate:deploy
```

### Просмотр данных

```bash
# Открыть Prisma Studio
npm run db:studio
```

### Быстрое обновление (только для разработки)

```bash
# Обновить схему без создания миграции
npm run db:push
```

## API Endpoints

- `GET /health` — проверка работоспособности
- `GET /api/orders` — список заказов
- `POST /api/orders` — создание заказа
- `GET /api/catalog/services` — список услуг
- И другие...

Подробная документация будет добавлена по мере разработки.

## Переменные окружения

См. `ENV_SETUP.md` для подробной информации о настройке переменных окружения.

## Дополнительная информация

- Схема БД: `prisma/schema.prisma`
- Документация по миграциям: `prisma/README.md`
- Настройка окружения: `ENV_SETUP.md`
