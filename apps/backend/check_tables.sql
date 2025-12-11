-- Скрипт для проверки существования таблиц
-- Выполните этот скрипт чтобы проверить, какие таблицы уже созданы

SELECT 
    TABLE_NAME,
    TABLE_TYPE
FROM 
    INFORMATION_SCHEMA.TABLES
WHERE 
    TABLE_SCHEMA = 'dbo'
    AND TABLE_NAME IN (
        'orders',
        'vehicle_brands',
        'vehicle_models',
        'vehicle_generations'
    )
ORDER BY 
    TABLE_NAME;

-- Проверка столбцов в таблице orders
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_SCHEMA = 'dbo'
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME IN (
        'serviceType',
        'serviceTypeOther',
        'vehicleGenerationId',
        'vehicleYear'
    )
ORDER BY 
    COLUMN_NAME;



