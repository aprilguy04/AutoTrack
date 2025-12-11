# System Architecture Blueprint

## 1. Design Goals
- Поддержка ролей «Гость», «Клиент», «Механик», «Администратор» с четким разграничением прав.
- Асинхронное обновление интерфейса (живой прогресс этапов ремонта).
- Возможность адаптации на другие домены (ремонт ПК, общепит и т.д.) без переписывания ядра.
- Изоляция слоев (UI → API → Domain → Data) для упрощения тестирования и расширяемости.

## 2. Шаблон архитектуры
- **Модульный монолит + Clean Architecture** на backend:
  - REST/GraphQL API слой (HTTP + WebSocket/SSE).
  - Application layer (use cases) без зависимостей от внешних фреймворков.
  - Domain layer (агрегаты: `Order`, `Stage`, `InventoryItem`, `User`, `Notification`).
  - Infrastructure layer (MS SQL repositories, file storage, email/push адаптеры).
- **Frontend**: SPA на React + TypeScript, структура feature-sliced:
  - `app/` — настройка роутов, глобальные провайдеры.
  - `pages/` — специфичные компоновки (Home, Dashboard, Orders).
  - `widgets/features/entities/shared` по методологии FSD, что облегчит переиспользование для других отраслей.

## 3. Высокоуровневая схема
```
[React SPA] --HTTPS--> [API Gateway (Nest/Express)] --use cases--> [Domain services] --ORM--> [MS SQL Server]
                                                    \--File adapter--> [Object Storage]
                                                    \--Event adapter--> [Notification broker (SignalR/SSE queue)]
```

## 4. Технологический стек (базовый)
- React 18 + Vite, React Router, React Query, Zustand/Redux Toolkit, Tailwind/Chakra UI.
- Node.js 20 + TypeScript, NestJS (за счет DI и модульности), class-validator, Swagger.
- Prisma или TypeORM с драйвером mssql.
- MS SQL Server 2019+ (основная БД).
- Redis (опционально) для сессий, очередей уведомлений и кэшей.
- Storage: Azure Blob/S3-совместимый бакет для фото/отчетов механиков.

## 5. Модули backend
| Модуль | Назначение |
| --- | --- |
| Auth & Identity | Регистрация, вход, refresh tokens, RBAC |
| Catalog | Описание услуг и этапов, выбор комплектующих |
| Orders & Workflow | Создание заказов, этапы, состояние, назначение механиков |
| Progress Tracking | Логи этапов, комментарии, вложения, уведомления |
| Notifications | E-mail/SMS/WebPush/SignalR события |
| Admin Panel | CRUD справочников, управление пользователями, отчетность |

Каждый модуль публикует события домена (`StageCompleted`, `OrderStatusChanged`) во внутреннюю шину (in-memory или Redis streams), что упрощает добавление новых реакций (например, интеграция с биллингом).

## 6. Асинхронный UI
- `React Query` + серверные события (SSE) или `WebSocket/SignalR` канал для мгновенного обновления прогресса.
- Фоновый `Polling` fallback каждые N секунд, если WebSocket недоступен.
- Оптимистичные апдейты для отметки выполнения этапов механиком.

## 7. Развертывание
- Контейнеризация (Docker) → `frontend`, `backend`, `db`, `redis`, `storage proxy`.
- CI/CD пайплайн: lint/test → build → push → deploy (GitHub Actions/Azure DevOps).
- Конфигурации через `.env` + секреты менеджера (Azure Key Vault, HashiCorp Vault).

## 8. Диаграммы
- `use-case.drawio` — роли/варианты использования (создать на основе таблицы требований).
- `db-logical-schema.drawio` — сущности (`Users`, `Roles`, `Orders`, `OrderStages`, `InventoryItems`, `StageFiles`, `Notifications`).
- `system-structure.drawio` — три слоя (UI/API/Domain/Data) + внешние сервисы (notif/file storage).

> TODO: заполнить draw.io файлы в `docs/architecture/` после согласования шаблона.






