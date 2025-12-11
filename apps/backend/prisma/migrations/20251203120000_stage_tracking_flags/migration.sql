-- Add adminLastViewedAt to orders
ALTER TABLE [dbo].[orders]
ADD [adminLastViewedAt] DATETIME2 NULL;

-- Add lastViewedAt to order stages
ALTER TABLE [dbo].[order_stages]
ADD [lastViewedAt] DATETIME2 NULL;

