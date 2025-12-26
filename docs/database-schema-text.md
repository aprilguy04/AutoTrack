# Логическая схема базы данных CURSED

## Текстовое представление для Word

Скопируй в Word и отформатируй как таблицу или используй draw.io файл.

```
┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│      User           │       │   VehicleBrand      │       │   VehicleModel      │
├─────────────────────┤       ├─────────────────────┤       ├─────────────────────┤
│ PK id: uuid         │       │ PK id: uuid         │       │ PK id: uuid         │
├─────────────────────┤       ├─────────────────────┤       ├─────────────────────┤
│    email            │       │    name             │       │ FK brandId          │
│    passwordHash     │       │    nameRu           │       │    name             │
│    fullName         │       │    logoUrl          │       │    nameRu           │
│    phone            │       │    isActive         │       │    isActive         │
│    role             │       └─────────────────────┘       └─────────────────────┘
│    isActive         │                │                           │
└─────────────────────┘                │ 1:N                       │ 1:N
         │                             ▼                           ▼
         │                    ┌─────────────────────┐
         │                    │ VehicleGeneration   │
         │ 1:N                ├─────────────────────┤
         │                    │ PK id: uuid         │
         ▼                    ├─────────────────────┤
┌─────────────────────┐       │ FK modelId          │
│      Order          │       │    name             │
├─────────────────────┤       │    nameRu           │
│ PK id: uuid         │       │    yearFrom         │
├─────────────────────┤       │    yearTo           │
│ FK customerId       │◄──────└─────────────────────┘
│ FK vehicleGenerationId              │
│ FK serviceTemplateId │              │
│    title            │               │
│    vehicleYear      │               │
│    serviceType      │               │
│    status           │               │
│    vinNumber        │               │
└─────────────────────┘               │
         │                            │
         │ 1:N                        │
         ▼                            │
┌─────────────────────┐               │
│    OrderStage       │               │
├─────────────────────┤               │
│ PK id: uuid         │               │
├─────────────────────┤               │
│ FK orderId          │               │
│ FK assignedTo       │───────────────┼──► User (механик)
│ FK stageTemplateId  │               │
│    name             │               │
│    status           │               │
│    orderIndex       │               │
│    startedAt        │               │
│    completedAt      │               │
└─────────────────────┘               │
    │           │                     │
    │ 1:N       │ 1:N                 │
    ▼           ▼                     │
┌───────────┐ ┌─────────────────┐     │
│StageComment│ │StageAttachment  │     │
├───────────┤ ├─────────────────┤     │
│PK id      │ │PK id            │     │
├───────────┤ ├─────────────────┤     │
│FK stageId │ │FK stageId       │     │
│FK authorId│ │FK uploadedById  │     │
│   content │ │   fileName      │     │
│   createdAt│ │   filePath     │     │
└───────────┘ └─────────────────┘     │
                                      │
┌─────────────────────┐               │
│  ServiceTemplate    │               │
├─────────────────────┤               │
│ PK id: uuid         │               │
├─────────────────────┤               │
│    name             │               │
│    description      │               │
│    isActive         │               │
└─────────────────────┘               │
         │                            │
         │ 1:N                        │
         ▼                            │
┌─────────────────────┐               │
│   StageTemplate     │               │
├─────────────────────┤               │
│ PK id: uuid         │               │
├─────────────────────┤               │
│ FK serviceTemplateId│               │
│    name             │               │
│    orderIndex       │               │
│    estimatedHours   │               │
└─────────────────────┘               │
                                      │
┌─────────────────────┐               │
│   InventoryItem     │               │
├─────────────────────┤               │
│ PK id: uuid         │               │
├─────────────────────┤               │
│    name             │               │
│    sku              │               │
│    category         │               │
│    stock            │               │
│    price            │               │
│    manufacturer     │               │
└─────────────────────┘               │
         │                            │
         │ 1:N                        │
         ▼                            │
┌─────────────────────────┐           │
│ OrderStageInventoryItem │           │
├─────────────────────────┤           │
│ PK id: uuid             │           │
├─────────────────────────┤           │
│ FK orderStageId         │◄──────────┘
│ FK inventoryItemId      │
│    quantity             │
│    isRequired           │
│    status               │
└─────────────────────────┘

┌─────────────────────┐
│    Notification     │
├─────────────────────┤
│ PK id: uuid         │
├─────────────────────┤
│ FK userId           │──► User
│ FK orderId          │──► Order
│    type             │
│    title            │
│    message          │
│    isRead           │
└─────────────────────┘
```

## Связи между таблицами

| Таблица 1 | Связь | Таблица 2 | Описание |
|-----------|-------|-----------|----------|
| VehicleBrand | 1:N | VehicleModel | Бренд содержит много моделей |
| VehicleModel | 1:N | VehicleGeneration | Модель имеет много поколений |
| User | 1:N | Order | Клиент создаёт много заказов |
| User | 1:N | OrderStage | Механик назначен на много этапов |
| User | 1:N | Notification | Пользователь получает много уведомлений |
| Order | 1:N | OrderStage | Заказ содержит много этапов |
| Order | 1:N | Notification | Заказ связан с уведомлениями |
| Order | N:1 | VehicleGeneration | Заказ связан с поколением авто |
| Order | N:1 | ServiceTemplate | Заказ создан по шаблону услуги |
| OrderStage | 1:N | StageComment | Этап имеет много комментариев |
| OrderStage | 1:N | StageAttachment | Этап имеет много вложений |
| OrderStage | 1:N | OrderStageInventoryItem | Этап содержит комплектующие |
| ServiceTemplate | 1:N | StageTemplate | Шаблон услуги содержит этапы |
| InventoryItem | 1:N | OrderStageInventoryItem | Товар используется в этапах |
