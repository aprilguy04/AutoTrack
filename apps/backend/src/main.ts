import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./db/prisma.js";

const app = buildApp();

// Проверка подключения к БД при старте
async function startServer() {
  try {
    console.log("🔌 Подключение к базе данных...");
    await prisma.$connect();
    console.log("✅ Подключение к базе данных установлено");

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 API listening on http://localhost:${env.PORT}`);
    });

    const shutdown = async () => {
      console.log("\n🛑 Shutting down server...");
      await prisma.$disconnect();
      server.close(() => {
        console.log("✅ Server stopped");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error: any) {
    console.error("❌ Ошибка подключения к базе данных:");
    if (error.code === "P1001") {
      console.error("   Не удается подключиться к серверу базы данных.");
      console.error("   Проверьте:");
      console.error("   1. Запущен ли SQL Server");
      console.error("   2. Правильно ли указан DATABASE_URL в .env файле");
      console.error("   3. Доступен ли сервер по указанному адресу и порту");
      if (process.env.DATABASE_URL) {
        const dbUrl = process.env.DATABASE_URL.replace(/password=[^;]+/i, "password=***");
        console.error(`   Текущий DATABASE_URL: ${dbUrl}`);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

startServer();


