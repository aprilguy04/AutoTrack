BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [fullName] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000),
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [users_role_df] DEFAULT 'client',
    [isActive] BIT NOT NULL CONSTRAINT [users_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[service_templates] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [service_templates_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [service_templates_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [service_templates_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[stage_templates] (
    [id] NVARCHAR(1000) NOT NULL,
    [serviceTemplateId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [orderIndex] INT NOT NULL,
    [estimatedHours] FLOAT(53),
    [isRequired] BIT NOT NULL CONSTRAINT [stage_templates_isRequired_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [stage_templates_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [stage_templates_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[orders] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [customerId] NVARCHAR(1000) NOT NULL,
    [vehicleInfo] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [orders_status_df] DEFAULT 'pending',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [orders_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [completedAt] DATETIME2,
    [serviceTemplateId] NVARCHAR(1000),
    CONSTRAINT [orders_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[order_stages] (
    [id] NVARCHAR(1000) NOT NULL,
    [orderId] NVARCHAR(1000) NOT NULL,
    [stageTemplateId] NVARCHAR(1000),
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [order_stages_status_df] DEFAULT 'pending',
    [assignedTo] NVARCHAR(1000),
    [startedAt] DATETIME2,
    [completedAt] DATETIME2,
    [orderIndex] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [order_stages_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [order_stages_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[stage_comments] (
    [id] NVARCHAR(1000) NOT NULL,
    [stageId] NVARCHAR(1000) NOT NULL,
    [authorId] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(4000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [stage_comments_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [stage_comments_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[stage_attachments] (
    [id] NVARCHAR(1000) NOT NULL,
    [stageId] NVARCHAR(1000) NOT NULL,
    [uploadedById] NVARCHAR(1000) NOT NULL,
    [fileName] NVARCHAR(1000) NOT NULL,
    [filePath] NVARCHAR(1000) NOT NULL,
    [fileSize] INT NOT NULL,
    [mimeType] NVARCHAR(1000),
    [description] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [stage_attachments_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [stage_attachments_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[inventory_items] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [category] NVARCHAR(1000) NOT NULL,
    [sku] NVARCHAR(1000),
    [stock] INT NOT NULL CONSTRAINT [inventory_items_stock_df] DEFAULT 0,
    [unit] NVARCHAR(1000) NOT NULL CONSTRAINT [inventory_items_unit_df] DEFAULT 'шт',
    [price] DECIMAL(10,2),
    [isActive] BIT NOT NULL CONSTRAINT [inventory_items_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [inventory_items_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [inventory_items_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [inventory_items_sku_key] UNIQUE NONCLUSTERED ([sku])
);

-- CreateTable
CREATE TABLE [dbo].[order_inventory_items] (
    [id] NVARCHAR(1000) NOT NULL,
    [orderId] NVARCHAR(1000) NOT NULL,
    [inventoryItemId] NVARCHAR(1000) NOT NULL,
    [quantity] INT NOT NULL CONSTRAINT [order_inventory_items_quantity_df] DEFAULT 1,
    [unitPrice] DECIMAL(10,2),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [order_inventory_items_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [order_inventory_items_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [order_inventory_items_orderId_inventoryItemId_key] UNIQUE NONCLUSTERED ([orderId],[inventoryItemId])
);

-- CreateTable
CREATE TABLE [dbo].[notifications] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [channel] NVARCHAR(1000) NOT NULL CONSTRAINT [notifications_channel_df] DEFAULT 'in_app',
    [title] NVARCHAR(1000) NOT NULL,
    [message] NVARCHAR(2000) NOT NULL,
    [isRead] BIT NOT NULL CONSTRAINT [notifications_isRead_df] DEFAULT 0,
    [readAt] DATETIME2,
    [metadata] NVARCHAR(4000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [notifications_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [orderId] NVARCHAR(1000),
    CONSTRAINT [notifications_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [users_email_idx] ON [dbo].[users]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [users_role_idx] ON [dbo].[users]([role]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stage_templates_serviceTemplateId_idx] ON [dbo].[stage_templates]([serviceTemplateId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [orders_customerId_idx] ON [dbo].[orders]([customerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [orders_status_idx] ON [dbo].[orders]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [orders_createdAt_idx] ON [dbo].[orders]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [order_stages_orderId_idx] ON [dbo].[order_stages]([orderId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [order_stages_assignedTo_idx] ON [dbo].[order_stages]([assignedTo]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [order_stages_status_idx] ON [dbo].[order_stages]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stage_comments_stageId_idx] ON [dbo].[stage_comments]([stageId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stage_comments_createdAt_idx] ON [dbo].[stage_comments]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stage_attachments_stageId_idx] ON [dbo].[stage_attachments]([stageId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [stage_attachments_createdAt_idx] ON [dbo].[stage_attachments]([createdAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [inventory_items_category_idx] ON [dbo].[inventory_items]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [inventory_items_sku_idx] ON [dbo].[inventory_items]([sku]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [order_inventory_items_orderId_idx] ON [dbo].[order_inventory_items]([orderId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [order_inventory_items_inventoryItemId_idx] ON [dbo].[order_inventory_items]([inventoryItemId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [notifications_userId_idx] ON [dbo].[notifications]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [notifications_isRead_idx] ON [dbo].[notifications]([isRead]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [notifications_createdAt_idx] ON [dbo].[notifications]([createdAt]);

-- AddForeignKey
ALTER TABLE [dbo].[stage_templates] ADD CONSTRAINT [stage_templates_serviceTemplateId_fkey] FOREIGN KEY ([serviceTemplateId]) REFERENCES [dbo].[service_templates]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[orders] ADD CONSTRAINT [orders_customerId_fkey] FOREIGN KEY ([customerId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[orders] ADD CONSTRAINT [orders_serviceTemplateId_fkey] FOREIGN KEY ([serviceTemplateId]) REFERENCES [dbo].[service_templates]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[order_stages] ADD CONSTRAINT [order_stages_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[orders]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[order_stages] ADD CONSTRAINT [order_stages_assignedTo_fkey] FOREIGN KEY ([assignedTo]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[order_stages] ADD CONSTRAINT [order_stages_stageTemplateId_fkey] FOREIGN KEY ([stageTemplateId]) REFERENCES [dbo].[stage_templates]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[stage_comments] ADD CONSTRAINT [stage_comments_stageId_fkey] FOREIGN KEY ([stageId]) REFERENCES [dbo].[order_stages]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[stage_comments] ADD CONSTRAINT [stage_comments_authorId_fkey] FOREIGN KEY ([authorId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[stage_attachments] ADD CONSTRAINT [stage_attachments_stageId_fkey] FOREIGN KEY ([stageId]) REFERENCES [dbo].[order_stages]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[stage_attachments] ADD CONSTRAINT [stage_attachments_uploadedById_fkey] FOREIGN KEY ([uploadedById]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[order_inventory_items] ADD CONSTRAINT [order_inventory_items_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[orders]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[order_inventory_items] ADD CONSTRAINT [order_inventory_items_inventoryItemId_fkey] FOREIGN KEY ([inventoryItemId]) REFERENCES [dbo].[inventory_items]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[notifications] ADD CONSTRAINT [notifications_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[notifications] ADD CONSTRAINT [notifications_orderId_fkey] FOREIGN KEY ([orderId]) REFERENCES [dbo].[orders]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
