-- Скрипт для пересоздания таблицы orders с правильной структурой
-- ВНИМАНИЕ: Все данные в таблице orders будут удалены!

BEGIN TRY
BEGIN TRAN;

-- Сначала удаляем данные из связанных таблиц (если они есть)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'order_stages')
    DELETE FROM [dbo].[order_stages];

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
    DELETE FROM [dbo].[notifications] WHERE [orderId] IS NOT NULL;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'order_inventory_items')
    DELETE FROM [dbo].[order_inventory_items];

-- Удаляем ВСЕ внешние ключи, которые ссылаются на таблицу orders (динамически)
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql = @sql + 'ALTER TABLE [' + OBJECT_SCHEMA_NAME(parent_object_id) + '].[' + OBJECT_NAME(parent_object_id) + '] DROP CONSTRAINT [' + name + '];' + CHAR(13)
FROM sys.foreign_keys
WHERE referenced_object_id = OBJECT_ID('orders');
EXEC sp_executesql @sql;

-- Удаляем ВСЕ внешние ключи из таблицы orders (динамически)
SET @sql = '';
SELECT @sql = @sql + 'ALTER TABLE [dbo].[orders] DROP CONSTRAINT [' + name + '];' + CHAR(13)
FROM sys.foreign_keys
WHERE parent_object_id = OBJECT_ID('orders');
EXEC sp_executesql @sql;

-- Удаляем индексы
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'orders_customerId_idx' AND object_id = OBJECT_ID('orders'))
    DROP INDEX [orders_customerId_idx] ON [dbo].[orders];

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'orders_status_idx' AND object_id = OBJECT_ID('orders'))
    DROP INDEX [orders_status_idx] ON [dbo].[orders];

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'orders_createdAt_idx' AND object_id = OBJECT_ID('orders'))
    DROP INDEX [orders_createdAt_idx] ON [dbo].[orders];

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'orders_vehicleGenerationId_idx' AND object_id = OBJECT_ID('orders'))
    DROP INDEX [orders_vehicleGenerationId_idx] ON [dbo].[orders];

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'orders_serviceType_idx' AND object_id = OBJECT_ID('orders'))
    DROP INDEX [orders_serviceType_idx] ON [dbo].[orders];

-- Удаляем таблицу orders
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'orders')
    DROP TABLE [dbo].[orders];

-- Создаем таблицу orders заново с правильной структурой
CREATE TABLE [dbo].[orders] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NULL,
    [customerId] NVARCHAR(1000) NOT NULL,
    [vehicleGenerationId] NVARCHAR(1000) NULL,
    [vehicleYear] INT NULL,
    [vehicleInfo] NVARCHAR(1000) NULL,
    [serviceType] NVARCHAR(1000) NOT NULL,
    [serviceTypeOther] NVARCHAR(1000) NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [orders_status_df] DEFAULT 'pending',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [orders_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [completedAt] DATETIME2 NULL,
    [serviceTemplateId] NVARCHAR(1000) NULL,
    CONSTRAINT [orders_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- Создаем индексы
CREATE NONCLUSTERED INDEX [orders_customerId_idx] ON [dbo].[orders]([customerId]);
CREATE NONCLUSTERED INDEX [orders_status_idx] ON [dbo].[orders]([status]);
CREATE NONCLUSTERED INDEX [orders_createdAt_idx] ON [dbo].[orders]([createdAt]);
CREATE NONCLUSTERED INDEX [orders_vehicleGenerationId_idx] ON [dbo].[orders]([vehicleGenerationId]);
CREATE NONCLUSTERED INDEX [orders_serviceType_idx] ON [dbo].[orders]([serviceType]);

-- Восстанавливаем внешние ключи
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
    ALTER TABLE [dbo].[orders] ADD CONSTRAINT [orders_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'service_templates')
    ALTER TABLE [dbo].[orders] ADD CONSTRAINT [orders_serviceTemplateId_fkey] FOREIGN KEY ([serviceTemplateId]) REFERENCES [dbo].[service_templates]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_generations')
    ALTER TABLE [dbo].[orders] ADD CONSTRAINT [orders_vehicleGenerationId_fkey] FOREIGN KEY ([vehicleGenerationId]) REFERENCES [dbo].[vehicle_generations]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- Восстанавливаем внешние ключи для связанных таблиц
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'order_stages')
    ALTER TABLE [dbo].[order_stages] ADD CONSTRAINT [order_stages_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[orders]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
    ALTER TABLE [dbo].[notifications] ADD CONSTRAINT [notifications_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[orders]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'order_inventory_items')
    ALTER TABLE [dbo].[order_inventory_items] ADD CONSTRAINT [order_inventory_items_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[orders]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;
PRINT 'Таблица orders успешно пересоздана!';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRAN;
    END;
    PRINT 'Ошибка при пересоздании таблицы orders:';
    PRINT ERROR_MESSAGE();
    THROW;
END CATCH

