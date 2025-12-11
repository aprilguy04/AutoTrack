# Настройка переменных окружения

Создайте файл `.env` в корне `apps/backend/` на основе этого примера:

```env
# Application
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Database
# Формат для MS SQL Server:
# DATABASE_URL="sqlserver://SERVER:PORT;database=DATABASE_NAME;user=USERNAME;password=PASSWORD;encrypt=true"
# 
# Пример для локального SQL Server:
DATABASE_URL="sqlserver://localhost:1433;database=autotrack_dev;user=sa;password=YourPassword123;encrypt=false;trustServerCertificate=true"

# Для Azure SQL Database:
# DATABASE_URL="sqlserver://your-server.database.windows.net:1433;database=autotrack;user=your-user;password=your-password;encrypt=true"

# Auth
# Секретный ключ для JWT токенов (минимум 32 символа)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# Секретный ключ для сессий (минимум 32 символа)
SESSION_SECRET="your-super-secret-session-key-change-this-in-production-min-32-chars"
```

## Параметры подключения

- `SERVER` - адрес SQL Server (localhost для локального, или имя сервера)
- `PORT` - порт (обычно 1433)
- `database` - имя базы данных
- `user` - имя пользователя
- `password` - пароль
- `encrypt` - использовать шифрование (true для Azure, false для локального)
- `trustServerCertificate` - доверять сертификату сервера (true для разработки)


