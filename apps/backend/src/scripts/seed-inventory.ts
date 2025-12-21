/**
 * Скрипт для заполнения базы данных комплектующими
 * Запуск: npm run seed:inventory
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const inventoryItems = [
  // ========== МАСЛА И ЖИДКОСТИ (Универсальные) ==========
  {
    name: "Моторное масло 5W-40 синтетика",
    description: "Высококачественное синтетическое моторное масло для современных двигателей",
    category: "Масла и жидкости",
    subcategory: "Моторные масла",
    sku: "OIL-5W40-4L",
    manufacturer: "Castrol",
    stock: 50,
    minStock: 10,
    unit: "л",
    price: 2500.0,
    cost: 1800.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Моторное масло 10W-40 полусинтетика",
    description: "Полусинтетическое моторное масло для бензиновых двигателей",
    category: "Масла и жидкости",
    subcategory: "Моторные масла",
    sku: "OIL-10W40-4L",
    manufacturer: "Mobil",
    stock: 45,
    minStock: 10,
    unit: "л",
    price: 1800.0,
    cost: 1200.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Моторное масло 0W-30 синтетика",
    description: "Современное синтетическое масло для экономичных двигателей",
    category: "Масла и жидкости",
    subcategory: "Моторные масла",
    sku: "OIL-0W30-4L",
    manufacturer: "Shell",
    stock: 35,
    minStock: 8,
    unit: "л",
    price: 2800.0,
    cost: 2100.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Антифриз G12+ красный",
    description: "Готовый к применению антифриз -40°C, срок службы 5 лет",
    category: "Масла и жидкости",
    subcategory: "Охлаждающие жидкости",
    sku: "AF-G12-5L",
    manufacturer: "LIQUI MOLY",
    stock: 30,
    minStock: 8,
    unit: "л",
    price: 800.0,
    cost: 550.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Антифриз G13 фиолетовый",
    description: "Экологичный антифриз нового поколения -40°C",
    category: "Масла и жидкости",
    subcategory: "Охлаждающие жидкости",
    sku: "AF-G13-5L",
    manufacturer: "LIQUI MOLY",
    stock: 25,
    minStock: 6,
    unit: "л",
    price: 950.0,
    cost: 680.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Тормозная жидкость DOT-4",
    description: "Высокотемпературная тормозная жидкость для всех типов тормозных систем",
    category: "Масла и жидкости",
    subcategory: "Тормозные жидкости",
    sku: "BF-DOT4-1L",
    manufacturer: "Bosch",
    stock: 25,
    minStock: 5,
    unit: "л",
    price: 450.0,
    cost: 280.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Омывающая жидкость -30°C",
    description: "Незамерзающая жидкость для стеклоомывателя с приятным ароматом",
    category: "Масла и жидкости",
    subcategory: "Омывающие жидкости",
    sku: "WF-30-5L",
    manufacturer: "Shell",
    stock: 60,
    minStock: 15,
    unit: "л",
    price: 250.0,
    cost: 150.0,
    isUniversal: true,
    isActive: true,
  },

  // ========== ФИЛЬТРЫ (Универсальные) ==========
  {
    name: "Фильтр масляный универсальный",
    description: "Масляный фильтр стандартного размера M20x1.5",
    category: "Фильтры",
    subcategory: "Масляные фильтры",
    sku: "OF-UNI-001",
    manufacturer: "Mann Filter",
    stock: 40,
    minStock: 10,
    unit: "шт",
    price: 450.0,
    cost: 280.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Фильтр воздушный универсальный",
    description: "Воздушный фильтр стандартного размера 280x220x50mm",
    category: "Фильтры",
    subcategory: "Воздушные фильтры",
    sku: "AF-UNI-001",
    manufacturer: "Bosch",
    stock: 35,
    minStock: 8,
    unit: "шт",
    price: 650.0,
    cost: 420.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Фильтр салонный угольный",
    description: "Угольный салонный фильтр с антибактериальной пропиткой",
    category: "Фильтры",
    subcategory: "Салонные фильтры",
    sku: "CF-CARB-001",
    manufacturer: "Mann Filter",
    stock: 30,
    minStock: 8,
    unit: "шт",
    price: 850.0,
    cost: 580.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Фильтр топливный универсальный",
    description: "Топливный фильтр для бензиновых двигателей",
    category: "Фильтры",
    subcategory: "Топливные фильтры",
    sku: "FF-UNI-001",
    manufacturer: "Bosch",
    stock: 28,
    minStock: 7,
    unit: "шт",
    price: 750.0,
    cost: 490.0,
    isUniversal: true,
    isActive: true,
  },

  // ========== СВЕЧИ ЗАЖИГАНИЯ (Универсальные) ==========
  {
    name: "Свечи зажигания иридиевые",
    description: "Долговечные иридиевые свечи, ресурс до 100 000 км",
    category: "Система зажигания",
    subcategory: "Свечи зажигания",
    sku: "SP-IRID-001",
    manufacturer: "NGK",
    stock: 80,
    minStock: 20,
    unit: "шт",
    price: 850.0,
    cost: 550.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Свечи зажигания платиновые",
    description: "Платиновые свечи повышенной долговечности, ресурс до 80 000 км",
    category: "Система зажигания",
    subcategory: "Свечи зажигания",
    sku: "SP-PLAT-001",
    manufacturer: "Denso",
    stock: 70,
    minStock: 15,
    unit: "шт",
    price: 750.0,
    cost: 480.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Свечи зажигания стандартные",
    description: "Классические свечи зажигания, ресурс до 30 000 км",
    category: "Система зажигания",
    subcategory: "Свечи зажигания",
    sku: "SP-STD-001",
    manufacturer: "Bosch",
    stock: 100,
    minStock: 25,
    unit: "шт",
    price: 350.0,
    cost: 220.0,
    isUniversal: true,
    isActive: true,
  },

  // ========== ЭЛЕКТРИКА (Универсальные) ==========
  {
    name: "Аккумулятор 60Ah 12V",
    description: "Стартерный аккумулятор 60Ah, пусковой ток 540A",
    category: "Электрика",
    subcategory: "Аккумуляторы",
    sku: "BAT-60AH",
    manufacturer: "Varta",
    stock: 15,
    minStock: 3,
    unit: "шт",
    price: 5500.0,
    cost: 4200.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Аккумулятор 75Ah 12V",
    description: "Стартерный аккумулятор 75Ah, пусковой ток 680A",
    category: "Электрика",
    subcategory: "Аккумуляторы",
    sku: "BAT-75AH",
    manufacturer: "Bosch",
    stock: 12,
    minStock: 3,
    unit: "шт",
    price: 6800.0,
    cost: 5200.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Лампа H7 галогенная",
    description: "Галогенная лампа ближнего света 55W",
    category: "Электрика",
    subcategory: "Лампы",
    sku: "LAMP-H7-55W",
    manufacturer: "Philips",
    stock: 50,
    minStock: 12,
    unit: "шт",
    price: 250.0,
    cost: 150.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Лампа H4 галогенная",
    description: "Галогенная лампа дальнего/ближнего света 60/55W",
    category: "Электрика",
    subcategory: "Лампы",
    sku: "LAMP-H4-60W",
    manufacturer: "Philips",
    stock: 45,
    minStock: 10,
    unit: "шт",
    price: 280.0,
    cost: 170.0,
    isUniversal: true,
    isActive: true,
  },

  // ========== ТОРМОЗНАЯ СИСТЕМА (Универсальные) ==========
  {
    name: "Колодки тормозные передние универсальные",
    description: "Передние тормозные колодки для дисковых тормозов",
    category: "Тормозная система",
    subcategory: "Тормозные колодки",
    sku: "BP-FRONT-UNI",
    manufacturer: "Brembo",
    stock: 25,
    minStock: 6,
    unit: "комплект",
    price: 2200.0,
    cost: 1500.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Колодки тормозные задние универсальные",
    description: "Задние тормозные колодки для дисковых тормозов",
    category: "Тормозная система",
    subcategory: "Тормозные колодки",
    sku: "BP-REAR-UNI",
    manufacturer: "Brembo",
    stock: 22,
    minStock: 5,
    unit: "комплект",
    price: 1800.0,
    cost: 1200.0,
    isUniversal: true,
    isActive: true,
  },

  // ========== РАСХОДНИКИ (Универсальные) ==========
  {
    name: "Щетки стеклоочистителя 600mm",
    description: "Бескаркасные щетки стеклоочистителя 600mm",
    category: "Расходники",
    subcategory: "Щетки стеклоочистителя",
    sku: "WB-600MM",
    manufacturer: "Bosch",
    stock: 30,
    minStock: 8,
    unit: "шт",
    price: 850.0,
    cost: 580.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Щетки стеклоочистителя 550mm",
    description: "Бескаркасные щетки стеклоочистителя 550mm",
    category: "Расходники",
    subcategory: "Щетки стеклоочистителя",
    sku: "WB-550MM",
    manufacturer: "Bosch",
    stock: 28,
    minStock: 7,
    unit: "шт",
    price: 800.0,
    cost: 550.0,
    isUniversal: true,
    isActive: true,
  },
  {
    name: "Прокладка масляного поддона",
    description: "Универсальная прокладка масляного поддона",
    category: "Расходники",
    subcategory: "Прокладки",
    sku: "GSKT-OILPAN",
    manufacturer: "Elring",
    stock: 20,
    minStock: 5,
    unit: "шт",
    price: 450.0,
    cost: 280.0,
    isUniversal: true,
    isActive: true,
  },
];

async function main() {
  console.log("🚀 Начинаем заполнение базы данных комплектующими...\n");

  let created = 0;
  let skipped = 0;

  for (const item of inventoryItems) {
    try {
      // Проверяем, существует ли уже комплектующее с таким SKU
      const existing = await prisma.inventoryItem.findFirst({
        where: { sku: item.sku },
      });

      if (existing) {
        console.log(`⏭️  Пропущено: ${item.name} (SKU: ${item.sku}) - уже существует`);
        skipped++;
        continue;
      }

      await prisma.inventoryItem.create({
        data: item,
      });

      console.log(`✅ Создано: ${item.name} (${item.category})`);
      created++;
    } catch (error) {
      console.error(`❌ Ошибка при создании ${item.name}:`, error);
    }
  }

  console.log(`\n📊 Результаты:`);
  console.log(`   ✅ Создано: ${created} комплектующих`);
  console.log(`   ⏭️  Пропущено: ${skipped} комплектующих`);
  console.log(`   📦 Всего в базе: ${await prisma.inventoryItem.count()} комплектующих\n`);
}

main()
  .catch((e) => {
    console.error("❌ Ошибка при выполнении скрипта:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
