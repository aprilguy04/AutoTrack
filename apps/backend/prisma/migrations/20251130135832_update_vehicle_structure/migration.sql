/*
  Warnings:

  - Added the required column `serviceType` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[orders] DROP CONSTRAINT [orders_serviceTemplateId_fkey];

-- AlterTable - сначала делаем vehicleInfo nullable
ALTER TABLE [dbo].[orders] ALTER COLUMN [vehicleInfo] NVARCHAR(1000) NULL;

-- Добавляем новые колонки как nullable
ALTER TABLE [dbo].[orders] ADD [serviceType] NVARCHAR(1000) NULL;
ALTER TABLE [dbo].[orders] ADD [serviceTypeOther] NVARCHAR(1000) NULL;
ALTER TABLE [dbo].[orders] ADD [vehicleGenerationId] NVARCHAR(1000) NULL;
ALTER TABLE [dbo].[orders] ADD [vehicleYear] INT NULL;

-- Обновляем существующие записи значением по умолчанию
UPDATE [dbo].[orders] SET [serviceType] = 'other' WHERE [serviceType] IS NULL;

-- Теперь делаем serviceType обязательным
ALTER TABLE [dbo].[orders] ALTER COLUMN [serviceType] NVARCHAR(1000) NOT NULL;

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE NONCLUSTERED INDEX [vehicle_brands_name_idx] ON [dbo].[vehicle_brands]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [vehicle_models_brandId_idx] ON [dbo].[vehicle_models]([brandId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [vehicle_models_name_idx] ON [dbo].[vehicle_models]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [vehicle_generations_modelId_idx] ON [dbo].[vehicle_generations]([modelId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [vehicle_generations_name_idx] ON [dbo].[vehicle_generations]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [orders_vehicleGenerationId_idx] ON [dbo].[orders]([vehicleGenerationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [orders_serviceType_idx] ON [dbo].[orders]([serviceType]);

-- AddForeignKey
ALTER TABLE [dbo].[vehicle_models] ADD CONSTRAINT [vehicle_models_brandId_fkey] FOREIGN KEY ([brandId]) REFERENCES [dbo].[vehicle_brands]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[vehicle_generations] ADD CONSTRAINT [vehicle_generations_modelId_fkey] FOREIGN KEY ([modelId]) REFERENCES [dbo].[vehicle_models]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[orders] ADD CONSTRAINT [orders_vehicleGenerationId_fkey] FOREIGN KEY ([vehicleGenerationId]) REFERENCES [dbo].[vehicle_generations]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[orders] ADD CONSTRAINT [orders_serviceTemplateId_fkey] FOREIGN KEY ([serviceTemplateId]) REFERENCES [dbo].[service_templates]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
