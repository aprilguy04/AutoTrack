-- Скрипт для создания таблиц автомобилей
-- Выполните этот скрипт ПЕРЕД запуском seed

BEGIN TRY
BEGIN TRAN;

-- Создаем таблицу vehicle_brands, если её еще нет
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_brands')
BEGIN
    CREATE TABLE [dbo].[vehicle_brands] (
        [id] NVARCHAR(1000) NOT NULL,
        [name] NVARCHAR(1000) NOT NULL,
        [nameRu] NVARCHAR(1000) NULL,
        [logoUrl] NVARCHAR(1000) NULL,
        [isActive] BIT NOT NULL CONSTRAINT [vehicle_brands_isActive_df] DEFAULT 1,
        [createdAt] DATETIME2 NOT NULL CONSTRAINT [vehicle_brands_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
        [updatedAt] DATETIME2 NOT NULL,
        CONSTRAINT [vehicle_brands_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [vehicle_brands_name_key] UNIQUE NONCLUSTERED ([name])
    );

    CREATE NONCLUSTERED INDEX [vehicle_brands_name_idx] ON [dbo].[vehicle_brands]([name]);
    PRINT 'Таблица vehicle_brands создана';
END
ELSE
BEGIN
    PRINT 'Таблица vehicle_brands уже существует';
END

-- Создаем таблицу vehicle_models, если её еще нет
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_models')
BEGIN
    CREATE TABLE [dbo].[vehicle_models] (
        [id] NVARCHAR(1000) NOT NULL,
        [brandId] NVARCHAR(1000) NOT NULL,
        [name] NVARCHAR(1000) NOT NULL,
        [nameRu] NVARCHAR(1000) NULL,
        [isActive] BIT NOT NULL CONSTRAINT [vehicle_models_isActive_df] DEFAULT 1,
        [createdAt] DATETIME2 NOT NULL CONSTRAINT [vehicle_models_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
        [updatedAt] DATETIME2 NOT NULL,
        CONSTRAINT [vehicle_models_pkey] PRIMARY KEY CLUSTERED ([id]),
        CONSTRAINT [vehicle_models_brandId_name_key] UNIQUE NONCLUSTERED ([brandId],[name])
    );

    CREATE NONCLUSTERED INDEX [vehicle_models_brandId_idx] ON [dbo].[vehicle_models]([brandId]);
    CREATE NONCLUSTERED INDEX [vehicle_models_name_idx] ON [dbo].[vehicle_models]([name]);
    PRINT 'Таблица vehicle_models создана';
END
ELSE
BEGIN
    PRINT 'Таблица vehicle_models уже существует';
END

-- Создаем таблицу vehicle_generations, если её еще нет
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_generations')
BEGIN
    CREATE TABLE [dbo].[vehicle_generations] (
        [id] NVARCHAR(1000) NOT NULL,
        [modelId] NVARCHAR(1000) NOT NULL,
        [name] NVARCHAR(1000) NOT NULL,
        [nameRu] NVARCHAR(1000) NULL,
        [yearFrom] INT NULL,
        [yearTo] INT NULL,
        [isActive] BIT NOT NULL CONSTRAINT [vehicle_generations_isActive_df] DEFAULT 1,
        [createdAt] DATETIME2 NOT NULL CONSTRAINT [vehicle_generations_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
        [updatedAt] DATETIME2 NOT NULL,
        CONSTRAINT [vehicle_generations_pkey] PRIMARY KEY CLUSTERED ([id])
    );

    CREATE NONCLUSTERED INDEX [vehicle_generations_modelId_idx] ON [dbo].[vehicle_generations]([modelId]);
    CREATE NONCLUSTERED INDEX [vehicle_generations_name_idx] ON [dbo].[vehicle_generations]([name]);
    PRINT 'Таблица vehicle_generations создана';
END
ELSE
BEGIN
    PRINT 'Таблица vehicle_generations уже существует';
END

-- Создаем внешние ключи
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_brands')
    AND EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_models')
    AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'vehicle_models_brandId_fkey')
BEGIN
    ALTER TABLE [dbo].[vehicle_models] ADD CONSTRAINT [vehicle_models_brandId_fkey] FOREIGN KEY ([brandId]) REFERENCES [dbo].[vehicle_brands]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;
    PRINT 'Внешний ключ vehicle_models_brandId_fkey создан';
END

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_models')
    AND EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_generations')
    AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'vehicle_generations_modelId_fkey')
BEGIN
    ALTER TABLE [dbo].[vehicle_generations] ADD CONSTRAINT [vehicle_generations_modelId_fkey] FOREIGN KEY ([modelId]) REFERENCES [dbo].[vehicle_models]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;
    PRINT 'Внешний ключ vehicle_generations_modelId_fkey создан';
END

-- Проверяем и создаем внешний ключ для orders, если таблица orders существует
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'orders')
    AND EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicle_generations')
    AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'vehicleGenerationId')
    AND NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'orders_vehicleGenerationId_fkey')
BEGIN
    ALTER TABLE [dbo].[orders] ADD CONSTRAINT [orders_vehicleGenerationId_fkey] FOREIGN KEY ([vehicleGenerationId]) REFERENCES [dbo].[vehicle_generations]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;
    PRINT 'Внешний ключ orders_vehicleGenerationId_fkey создан';
END

COMMIT TRAN;
PRINT 'Все таблицы автомобилей успешно созданы!';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRAN;
    END;
    PRINT 'Ошибка при создании таблиц:';
    PRINT ERROR_MESSAGE();
    THROW;
END CATCH



