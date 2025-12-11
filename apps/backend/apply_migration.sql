-- Скрипт для применения миграции вручную
-- Выполните этот скрипт в SQL Server Management Studio или через sqlcmd

BEGIN TRY
BEGIN TRAN;

-- DropForeignKey (если существует)
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'orders_serviceTemplateId_fkey')
    ALTER TABLE [dbo].[orders] DROP CONSTRAINT [orders_serviceTemplateId_fkey];

-- AlterTable - сначала делаем vehicleInfo nullable (если еще не nullable)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'vehicleInfo' AND is_nullable = 0)
    ALTER TABLE [dbo].[orders] ALTER COLUMN [vehicleInfo] NVARCHAR(1000) NULL;

-- Добавляем serviceType, если его еще нет
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'serviceType')
BEGIN
    ALTER TABLE [dbo].[orders] ADD [serviceType] NVARCHAR(1000) NULL;
    -- Сразу обновляем существующие записи
    UPDATE [dbo].[orders] SET [serviceType] = 'other' WHERE [serviceType] IS NULL;
    -- Делаем обязательным
    ALTER TABLE [dbo].[orders] ALTER COLUMN [serviceType] NVARCHAR(1000) NOT NULL;
END
ELSE
BEGIN
    -- Если столбец уже существует, просто обновляем NULL значения
    UPDATE [dbo].[orders] SET [serviceType] = 'other' WHERE [serviceType] IS NULL;
    -- Делаем обязательным, если еще не обязательный
    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'serviceType' AND is_nullable = 1)
    BEGIN
        ALTER TABLE [dbo].[orders] ALTER COLUMN [serviceType] NVARCHAR(1000) NOT NULL;
    END
END

-- Добавляем serviceTypeOther, если его еще нет
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'serviceTypeOther')
    ALTER TABLE [dbo].[orders] ADD [serviceTypeOther] NVARCHAR(1000) NULL;

-- Добавляем vehicleGenerationId, если его еще нет
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'vehicleGenerationId')
    ALTER TABLE [dbo].[orders] ADD [vehicleGenerationId] NVARCHAR(1000) NULL;

-- Добавляем vehicleYear, если его еще нет
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'vehicleYear')
    ALTER TABLE [dbo].[orders] ADD [vehicleYear] INT NULL;

-- Создаем таблицы для автомобилей, если их еще нет
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_brands')
BEGIN
    CREATE TABLE [dbo].[vehicle_brands] (
        [id] NVARCHAR(1000) NOT NULL,
        [name] NVARCHAR(1000) NOT NULL,
        [nameRu] NVARCHAR(1000),
        [logoUrl] NVARCHAR(1000),
        [isActive] BIT NOT NULL CONSTRAINT [vehicle_brands_isActive_df] DEFAULT 1,
        [createdAt] DATETIME2 NOT NULL CONSTRAINT [vehicle_brands_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
        [updatedAt] DATETIME2 NOT NULL,
        CONSTRAINT [vehicle_brands_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [vehicle_brands_name_key] UNIQUE NONCLUSTERED ([name])
    );

    CREATE NONCLUSTERED INDEX [vehicle_brands_name_idx] ON [dbo].[vehicle_brands]([name]);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_models')
BEGIN
    CREATE TABLE [dbo].[vehicle_models] (
        [id] NVARCHAR(1000) NOT NULL,
        [brandId] NVARCHAR(1000) NOT NULL,
        [name] NVARCHAR(1000) NOT NULL,
        [nameRu] NVARCHAR(1000),
        [isActive] BIT NOT NULL CONSTRAINT [vehicle_models_isActive_df] DEFAULT 1,
        [createdAt] DATETIME2 NOT NULL CONSTRAINT [vehicle_models_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
        [updatedAt] DATETIME2 NOT NULL,
        CONSTRAINT [vehicle_models_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [vehicle_models_brandId_name_key] UNIQUE NONCLUSTERED ([brandId],[name])
    );

    CREATE NONCLUSTERED INDEX [vehicle_models_brandId_idx] ON [dbo].[vehicle_models]([brandId]);
    CREATE NONCLUSTERED INDEX [vehicle_models_name_idx] ON [dbo].[vehicle_models]([name]);
END

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_generations')
BEGIN
    CREATE TABLE [dbo].[vehicle_generations] (
        [id] NVARCHAR(1000) NOT NULL,
        [modelId] NVARCHAR(1000) NOT NULL,
        [name] NVARCHAR(1000) NOT NULL,
        [nameRu] NVARCHAR(1000),
        [yearFrom] INT,
        [yearTo] INT,
        [isActive] BIT NOT NULL CONSTRAINT [vehicle_generations_isActive_df] DEFAULT 1,
        [createdAt] DATETIME2 NOT NULL CONSTRAINT [vehicle_generations_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
        [updatedAt] DATETIME2 NOT NULL,
        CONSTRAINT [vehicle_generations_pkey] PRIMARY KEY CLUSTERED ([id])
    );

    CREATE NONCLUSTERED INDEX [vehicle_generations_modelId_idx] ON [dbo].[vehicle_generations]([modelId]);
    CREATE NONCLUSTERED INDEX [vehicle_generations_name_idx] ON [dbo].[vehicle_generations]([name]);
END

-- Добавляем индексы для orders, если их еще нет (только если столбцы существуют)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'vehicleGenerationId')
    AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'orders_vehicleGenerationId_idx' AND object_id = OBJECT_ID('orders'))
    CREATE NONCLUSTERED INDEX [orders_vehicleGenerationId_idx] ON [dbo].[orders]([vehicleGenerationId]);

IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'serviceType')
    AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'orders_serviceType_idx' AND object_id = OBJECT_ID('orders'))
    CREATE NONCLUSTERED INDEX [orders_serviceType_idx] ON [dbo].[orders]([serviceType]);

-- Добавляем внешние ключи, если их еще нет
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_brands')
    AND EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_models')
    AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'vehicle_models_brandId_fkey')
    ALTER TABLE [dbo].[vehicle_models] ADD CONSTRAINT [vehicle_models_brandId_fkey] FOREIGN KEY ([brandId]) REFERENCES [dbo].[vehicle_brands]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_models')
    AND EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_generations')
    AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'vehicle_generations_modelId_fkey')
    ALTER TABLE [dbo].[vehicle_generations] ADD CONSTRAINT [vehicle_generations_modelId_fkey] FOREIGN KEY ([modelId]) REFERENCES [dbo].[vehicle_models]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_generations')
    AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'vehicleGenerationId')
    AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'orders_vehicleGenerationId_fkey')
    ALTER TABLE [dbo].[orders] ADD CONSTRAINT [orders_vehicleGenerationId_fkey] FOREIGN KEY ([vehicleGenerationId]) REFERENCES [dbo].[vehicle_generations]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'service_templates')
    AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'serviceTemplateId')
    AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'orders_serviceTemplateId_fkey')
    ALTER TABLE [dbo].[orders] ADD CONSTRAINT [orders_serviceTemplateId_fkey] FOREIGN KEY ([serviceTemplateId]) REFERENCES [dbo].[service_templates]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;
PRINT 'Миграция успешно применена!';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRAN;
    END;
    PRINT 'Ошибка при применении миграции:';
    PRINT ERROR_MESSAGE();
    THROW;
END CATCH
