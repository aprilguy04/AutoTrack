# Backend Module Breakdown

## 1. Auth & Identity
- **Задачи**: регистрация, аутентификация, refresh/ access tokens, сброс пароля, управление ролями.
- **Интерфейсы**:
  - REST: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.
  - Events: `UserRegistered`, `UserRoleChanged`.
- **Зависимости**: `UsersRepository`, `PasswordHasher`, `TokenService`, `NotificationPort`.

## 2. Catalog (Services & Inventory)
- **Задачи**: CRUD услуг автосервиса, этапов шаблонов ремонта, комплектующих и расходников.
- **Интерфейсы**:
  - `GET /catalog/services`, `POST /admin/catalog/services`.
  - `GET /catalog/stages`, `POST /admin/catalog/stages`.
  - `GET /catalog/inventory`, `POST /admin/catalog/inventory`.
- **Зависимости**: `ServiceTemplateRepository`, `InventoryRepository`, `FileStoragePort`.

## 3. Orders & Workflow
- **Задачи**: оформление заказов, привязка к клиенту, формирование цепочки этапов из шаблона, назначение механиков.
- **Интерфейсы**:
  - `POST /orders`, `GET /orders/{id}`, `GET /orders?status=`.
  - `POST /orders/{id}/assign` (админ), `POST /orders/{id}/stages/{stageId}/assign`.
- **Зависимости**: `OrderRepository`, `WorkflowEngine`, `AssignmentService`, `CatalogModule`.
- **События**: `OrderCreated`, `MechanicAssigned`, `OrderStatusChanged`.

## 4. Progress Tracking
- **Задачи**: выполнение этапов, отметки статусов, комментарии, вложения, журнал действий.
- **Интерфейсы**:
  - `POST /orders/{id}/stages/{stageId}/complete`.
  - `POST /orders/{id}/stages/{stageId}/comments`.
  - `POST /orders/{id}/stages/{stageId}/attachments`.
  - `GET /orders/{id}/timeline`.
- **Зависимости**: `StageRepository`, `AttachmentStorage`, `NotificationModule`.
- **Асинхронщина**: публикует `StageCompleted`, `StageCommentAdded`, `StageAttachmentUploaded`.

## 5. Notifications
- **Задачи**: доставка уведомлений клиенту/механику/админу о важных событиях.
- **Каналы**: email, SMS, WebPush, WebSocket/SSE.
- **Интерфейсы**:
  - Слушает доменные события.
  - REST настройки: `GET/PUT /profile/notifications`.
- **Зависимости**: `NotificationPreferencesRepository`, адаптеры каналов (`EmailProvider`, `SmsProvider`, `SocketHub`).

## 6. Admin Panel
- **Задачи**: управление пользователями, ролями, справочниками, отчетность по заказам.
- **Интерфейсы**: `/admin/users`, `/admin/orders`, `/admin/catalog`.
- **Инструменты**: таблицы с фильтрами, экспорт CSV/PDF, дешборды.

# Frontend Feature Breakdown (FSD)

## Entities
- `entities/user` — модель аккаунта, хук `useCurrentUser`, guard.
- `entities/order`, `entities/stage`, `entities/inventory`.

## Features
- `features/auth` — формы логина/регистрации, refresh handling.
- `features/order-create` — мастер создания заказа, выбор шаблона, конфигурация этапов.
- `features/stage-progress` — отметка статусов, загрузка файлов, комментарии.
- `features/notifications` — настройки каналов, realtime toasts.

## Widgets
- `widgets/order-tracker` — визуализация этапов (timeline + progress bar).
- `widgets/assigned-orders` — панель механика.
- `widgets/admin-stage-board`, `widgets/inventory-picker`.

## Pages
- `pages/home` — информация об услугах (доступно гостю).
- `pages/client-dashboard` — список заказов, прогресс.
- `pages/mechanic-dashboard`.
- `pages/admin-console`.

# Cross-Cutting Concerns
- **RBAC Middleware** на backend + маршрутизатор защищенных страниц на frontend.
- **Audit log** для критичных действий (CRUD этапов, удаление профиля).
- **Error handling & observability**: логирование (Winston + Seq), метрики (Prometheus).
- **Validation**: DTO schema validators на входе, invariants в domain layer.






