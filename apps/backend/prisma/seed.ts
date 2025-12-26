/**
 * Seed скрипт для начальных данных
 * Запуск: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log("🌱 Начинаем заполнение базы данных...");

  // Хешируем пароли
  const defaultPassword = "password123"; // Общий пароль для всех тестовых пользователей
  const passwordHash = await hashPassword(defaultPassword);

  // Создаем тестовых пользователей
  const admin = await prisma.user.upsert({
    where: { email: "admin@autotrack.local" },
    update: {},
    create: {
      email: "admin@autotrack.local",
      passwordHash,
      fullName: "Администратор",
      role: "admin",
      phone: "+375291234567",
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "client@autotrack.local" },
    update: {},
    create: {
      email: "client@autotrack.local",
      passwordHash,
      fullName: "Тестовый Клиент",
      role: "client",
      phone: "+375291234568",
    },
  });

  const mechanic = await prisma.user.upsert({
    where: { email: "mechanic@autotrack.local" },
    update: {},
    create: {
      email: "mechanic@autotrack.local",
      passwordHash,
      fullName: "Иван Механиков",
      role: "mechanic",
      phone: "+375291234569",
    },
  });

  console.log("✅ Пользователи созданы");
  console.log("   Админ: admin@autotrack.local / password123");
  console.log("   Клиент: client@autotrack.local / password123");
  console.log("   Механик: mechanic@autotrack.local / password123");

  // Создаем базу автомобилей
  console.log("🚗 Создание базы автомобилей...");

  // Вспомогательная функция для создания модели с поколениями
  async function createModelWithGenerations(
    brandId: string,
    modelName: string,
    modelNameRu: string,
    generations: Array<{ name: string; nameRu: string; yearFrom: number | null; yearTo: number | null }>,
  ) {
    let model = await prisma.vehicleModel.findFirst({
      where: { brandId, name: modelName },
    });
    if (!model) {
      model = await prisma.vehicleModel.create({
        data: {
          brandId,
          name: modelName,
          nameRu: modelNameRu,
          generations: {
            create: generations,
          },
        },
      });
    }
    return model;
  }

  // Audi
  let audi = await prisma.vehicleBrand.findUnique({ where: { name: "Audi" } });
  if (!audi) {
    audi = await prisma.vehicleBrand.create({
      data: { name: "Audi", nameRu: "Ауди" },
    });
  }
  await createModelWithGenerations(audi.id, "A4", "А4", [
    { name: "B8", nameRu: "B8 (2008-2015)", yearFrom: 2008, yearTo: 2015 },
    { name: "B9", nameRu: "B9 (2015-2023)", yearFrom: 2015, yearTo: 2023 },
  ]);
  await createModelWithGenerations(audi.id, "A6", "А6", [
    { name: "C7", nameRu: "C7 (2011-2018)", yearFrom: 2011, yearTo: 2018 },
    { name: "C8", nameRu: "C8 (2018-)", yearFrom: 2018, yearTo: null },
  ]);
  await createModelWithGenerations(audi.id, "Q5", "Q5", [
    { name: "8R", nameRu: "8R (2008-2017)", yearFrom: 2008, yearTo: 2017 },
    { name: "FY", nameRu: "FY (2017-)", yearFrom: 2017, yearTo: null },
  ]);

  // BMW
  let bmw = await prisma.vehicleBrand.findUnique({ where: { name: "BMW" } });
  if (!bmw) {
    bmw = await prisma.vehicleBrand.create({
      data: { name: "BMW", nameRu: "БМВ" },
    });
  }
  await createModelWithGenerations(bmw.id, "3 Series", "3 серия", [
    { name: "E90", nameRu: "E90 (2005-2012)", yearFrom: 2005, yearTo: 2012 },
    { name: "F30", nameRu: "F30 (2012-2019)", yearFrom: 2012, yearTo: 2019 },
    { name: "G20", nameRu: "G20 (2019-)", yearFrom: 2019, yearTo: null },
  ]);
  await createModelWithGenerations(bmw.id, "5 Series", "5 серия", [
    { name: "F10", nameRu: "F10 (2010-2017)", yearFrom: 2010, yearTo: 2017 },
    { name: "G30", nameRu: "G30 (2017-)", yearFrom: 2017, yearTo: null },
  ]);
  await createModelWithGenerations(bmw.id, "X5", "X5", [
    { name: "E70", nameRu: "E70 (2006-2013)", yearFrom: 2006, yearTo: 2013 },
    { name: "F15", nameRu: "F15 (2013-2018)", yearFrom: 2013, yearTo: 2018 },
    { name: "G05", nameRu: "G05 (2018-)", yearFrom: 2018, yearTo: null },
  ]);

  // Mercedes-Benz
  let mercedes = await prisma.vehicleBrand.findUnique({ where: { name: "Mercedes-Benz" } });
  if (!mercedes) {
    mercedes = await prisma.vehicleBrand.create({
      data: { name: "Mercedes-Benz", nameRu: "Мерседес-Бенц" },
    });
  }
  await createModelWithGenerations(mercedes.id, "C-Class", "C-класс", [
    { name: "W204", nameRu: "W204 (2007-2014)", yearFrom: 2007, yearTo: 2014 },
    { name: "W205", nameRu: "W205 (2014-2021)", yearFrom: 2014, yearTo: 2021 },
    { name: "W206", nameRu: "W206 (2021-)", yearFrom: 2021, yearTo: null },
  ]);
  await createModelWithGenerations(mercedes.id, "E-Class", "E-класс", [
    { name: "W212", nameRu: "W212 (2009-2016)", yearFrom: 2009, yearTo: 2016 },
    { name: "W213", nameRu: "W213 (2016-)", yearFrom: 2016, yearTo: null },
  ]);

  // Volkswagen
  let vw = await prisma.vehicleBrand.findUnique({ where: { name: "Volkswagen" } });
  if (!vw) {
    vw = await prisma.vehicleBrand.create({
      data: { name: "Volkswagen", nameRu: "Фольксваген" },
    });
  }
  await createModelWithGenerations(vw.id, "Passat", "Пассат", [
    { name: "B6", nameRu: "B6 (2005-2010)", yearFrom: 2005, yearTo: 2010 },
    { name: "B7", nameRu: "B7 (2010-2015)", yearFrom: 2010, yearTo: 2015 },
    { name: "B8", nameRu: "B8 (2015-)", yearFrom: 2015, yearTo: null },
  ]);
  await createModelWithGenerations(vw.id, "Golf", "Гольф", [
    { name: "V", nameRu: "V (2003-2008)", yearFrom: 2003, yearTo: 2008 },
    { name: "VI", nameRu: "VI (2008-2012)", yearFrom: 2008, yearTo: 2012 },
    { name: "VII", nameRu: "VII (2012-2019)", yearFrom: 2012, yearTo: 2019 },
    { name: "VIII", nameRu: "VIII (2019-)", yearFrom: 2019, yearTo: null },
  ]);

  // Toyota
  let toyota = await prisma.vehicleBrand.findUnique({ where: { name: "Toyota" } });
  if (!toyota) {
    toyota = await prisma.vehicleBrand.create({
      data: { name: "Toyota", nameRu: "Тойота" },
    });
  }
  await createModelWithGenerations(toyota.id, "Camry", "Камри", [
    { name: "XV40", nameRu: "XV40 (2006-2011)", yearFrom: 2006, yearTo: 2011 },
    { name: "XV50", nameRu: "XV50 (2011-2017)", yearFrom: 2011, yearTo: 2017 },
    { name: "XV70", nameRu: "XV70 (2017-)", yearFrom: 2017, yearTo: null },
  ]);
  await createModelWithGenerations(toyota.id, "RAV4", "RAV4", [
    { name: "XA30", nameRu: "XA30 (2005-2012)", yearFrom: 2005, yearTo: 2012 },
    { name: "XA40", nameRu: "XA40 (2012-2018)", yearFrom: 2012, yearTo: 2018 },
    { name: "XA50", nameRu: "XA50 (2018-)", yearFrom: 2018, yearTo: null },
  ]);

  // Добавляем еще популярные марки
  const brands = [
    { name: "Hyundai", nameRu: "Хёндай", models: [
      { name: "Elantra", nameRu: "Элантра", generations: [
        { name: "MD", nameRu: "MD (2010-2015)", yearFrom: 2010, yearTo: 2015 },
        { name: "AD", nameRu: "AD (2015-2020)", yearFrom: 2015, yearTo: 2020 },
        { name: "CN7", nameRu: "CN7 (2020-)", yearFrom: 2020, yearTo: null },
      ]},
      { name: "Tucson", nameRu: "Туссан", generations: [
        { name: "TL", nameRu: "TL (2015-2020)", yearFrom: 2015, yearTo: 2020 },
        { name: "NX4", nameRu: "NX4 (2020-)", yearFrom: 2020, yearTo: null },
      ]},
    ]},
    { name: "Kia", nameRu: "Киа", models: [
      { name: "Optima", nameRu: "Оптима", generations: [
        { name: "TF", nameRu: "TF (2010-2015)", yearFrom: 2010, yearTo: 2015 },
        { name: "JF", nameRu: "JF (2015-2020)", yearFrom: 2015, yearTo: 2020 },
      ]},
      { name: "Sportage", nameRu: "Спортейдж", generations: [
        { name: "SL", nameRu: "SL (2010-2015)", yearFrom: 2010, yearTo: 2015 },
        { name: "QL", nameRu: "QL (2015-2021)", yearFrom: 2015, yearTo: 2021 },
        { name: "NQ5", nameRu: "NQ5 (2021-)", yearFrom: 2021, yearTo: null },
      ]},
    ]},
    { name: "Ford", nameRu: "Форд", models: [
      { name: "Focus", nameRu: "Фокус", generations: [
        { name: "III", nameRu: "III (2011-2018)", yearFrom: 2011, yearTo: 2018 },
        { name: "IV", nameRu: "IV (2018-)", yearFrom: 2018, yearTo: null },
      ]},
      { name: "Mondeo", nameRu: "Мондео", generations: [
        { name: "CD391", nameRu: "CD391 (2014-2022)", yearFrom: 2014, yearTo: 2022 },
      ]},
    ]},
  ];

  for (const brandData of brands) {
    let brand = await prisma.vehicleBrand.findUnique({ where: { name: brandData.name } });
    if (!brand) {
      brand = await prisma.vehicleBrand.create({
        data: { name: brandData.name, nameRu: brandData.nameRu },
      });
    }
    for (const modelData of brandData.models) {
      await createModelWithGenerations(brand.id, modelData.name, modelData.nameRu, modelData.generations);
    }
  }

  console.log("✅ База автомобилей создана");

  // Создаем шаблоны услуг
  console.log("🔧 Создание шаблонов услуг...");

  // Диагностика двигателя
  await prisma.serviceTemplate.upsert({
    where: { id: "service-diagnostic" },
    update: {},
    create: {
      id: "service-diagnostic",
      name: "Диагностика двигателя",
      description: "Полная компьютерная диагностика двигателя с использованием современного оборудования. Выявление неисправностей и рекомендации по ремонту.",
      isActive: true,
      stageTemplates: {
        create: [
          {
            name: "Проверка ошибок",
            description: "Считывание кодов ошибок с ЭБУ",
            orderIndex: 1,
            estimatedHours: 0.5,
            isRequired: true,
          },
          {
            name: "Визуальный осмотр",
            description: "Осмотр двигателя на предмет утечек и повреждений",
            orderIndex: 2,
            estimatedHours: 0.5,
            isRequired: true,
          },
          {
            name: "Проверка компрессии",
            description: "Измерение компрессии в цилиндрах",
            orderIndex: 3,
            estimatedHours: 1.0,
            isRequired: false,
          },
        ],
      },
    },
  });

  // Замена масла
  await prisma.serviceTemplate.upsert({
    where: { id: "service-oil-change" },
    update: {},
    create: {
      id: "service-oil-change",
      name: "Замена масла",
      description: "Замена моторного масла и масляного фильтра. Проверка уровня и состояния других технических жидкостей.",
      isActive: true,
      stageTemplates: {
        create: [
          {
            name: "Слив старого масла",
            description: "Слив отработанного моторного масла",
            orderIndex: 1,
            estimatedHours: 0.3,
            isRequired: true,
          },
          {
            name: "Замена фильтра",
            description: "Замена масляного фильтра",
            orderIndex: 2,
            estimatedHours: 0.2,
            isRequired: true,
          },
          {
            name: "Заливка нового масла",
            description: "Заливка свежего моторного масла",
            orderIndex: 3,
            estimatedHours: 0.2,
            isRequired: true,
          },
          {
            name: "Проверка уровней жидкостей",
            description: "Проверка уровня охлаждающей жидкости, тормозной жидкости, омывателя",
            orderIndex: 4,
            estimatedHours: 0.3,
            isRequired: false,
          },
        ],
      },
    },
  });

  // Ремонт тормозной системы
  await prisma.serviceTemplate.upsert({
    where: { id: "service-brake-repair" },
    update: {},
    create: {
      id: "service-brake-repair",
      name: "Ремонт тормозной системы",
      description: "Диагностика и ремонт тормозной системы: замена колодок, дисков, суппортов. Прокачка тормозов.",
      isActive: true,
      stageTemplates: {
        create: [
          {
            name: "Осмотр тормозной системы",
            description: "Визуальный осмотр и измерение износа компонентов",
            orderIndex: 1,
            estimatedHours: 0.5,
            isRequired: true,
          },
          {
            name: "Замена тормозных колодок",
            description: "Снятие старых и установка новых тормозных колодок",
            orderIndex: 2,
            estimatedHours: 1.5,
            isRequired: true,
          },
          {
            name: "Проверка/замена дисков",
            description: "Измерение толщины дисков, при необходимости замена",
            orderIndex: 3,
            estimatedHours: 1.0,
            isRequired: false,
          },
          {
            name: "Прокачка тормозов",
            description: "Удаление воздуха из тормозной системы",
            orderIndex: 4,
            estimatedHours: 0.5,
            isRequired: false,
          },
          {
            name: "Тестовая поездка",
            description: "Проверка работы тормозов на ходу",
            orderIndex: 5,
            estimatedHours: 0.5,
            isRequired: true,
          },
        ],
      },
    },
  });

  // Техническое обслуживание
  await prisma.serviceTemplate.upsert({
    where: { id: "service-maintenance" },
    update: {},
    create: {
      id: "service-maintenance",
      name: "Техническое обслуживание (ТО)",
      description: "Комплексное техническое обслуживание автомобиля согласно регламенту производителя.",
      isActive: true,
      stageTemplates: {
        create: [
          {
            name: "Первичный осмотр",
            description: "Осмотр автомобиля, фиксация пробега и состояния",
            orderIndex: 1,
            estimatedHours: 0.5,
            isRequired: true,
          },
          {
            name: "Замена масла и фильтров",
            description: "Замена моторного масла, масляного и воздушного фильтров",
            orderIndex: 2,
            estimatedHours: 1.0,
            isRequired: true,
          },
          {
            name: "Проверка жидкостей",
            description: "Проверка и доливка всех технических жидкостей",
            orderIndex: 3,
            estimatedHours: 0.5,
            isRequired: true,
          },
          {
            name: "Проверка тормозов",
            description: "Осмотр тормозной системы, измерение износа",
            orderIndex: 4,
            estimatedHours: 0.5,
            isRequired: true,
          },
          {
            name: "Проверка подвески",
            description: "Осмотр элементов подвески на износ и повреждения",
            orderIndex: 5,
            estimatedHours: 1.0,
            isRequired: true,
          },
          {
            name: "Финальная проверка",
            description: "Итоговый осмотр и тест-драйв",
            orderIndex: 6,
            estimatedHours: 0.5,
            isRequired: true,
          },
        ],
      },
    },
  });

  // Ремонт подвески
  await prisma.serviceTemplate.upsert({
    where: { id: "service-suspension" },
    update: {},
    create: {
      id: "service-suspension",
      name: "Ремонт подвески",
      description: "Диагностика и ремонт ходовой части: замена амортизаторов, рычагов, сайлентблоков, шаровых опор.",
      isActive: true,
      stageTemplates: {
        create: [
          {
            name: "Диагностика подвески",
            description: "Осмотр на подъёмнике, выявление неисправностей",
            orderIndex: 1,
            estimatedHours: 1.0,
            isRequired: true,
          },
          {
            name: "Заказ запчастей",
            description: "Подбор и заказ необходимых запчастей",
            orderIndex: 2,
            estimatedHours: 0.5,
            isRequired: true,
          },
          {
            name: "Разборка узлов",
            description: "Демонтаж неисправных элементов подвески",
            orderIndex: 3,
            estimatedHours: 2.0,
            isRequired: true,
          },
          {
            name: "Замена деталей",
            description: "Установка новых деталей подвески",
            orderIndex: 4,
            estimatedHours: 3.0,
            isRequired: true,
          },
          {
            name: "Регулировка углов установки колёс",
            description: "Проверка и регулировка развал-схождения",
            orderIndex: 5,
            estimatedHours: 1.0,
            isRequired: true,
          },
        ],
      },
    },
  });

  // Кузовной ремонт
  await prisma.serviceTemplate.upsert({
    where: { id: "service-body-repair" },
    update: {},
    create: {
      id: "service-body-repair",
      name: "Кузовной ремонт",
      description: "Ремонт кузова после ДТП или коррозии: рихтовка, сварка, покраска, полировка.",
      isActive: true,
      stageTemplates: {
        create: [
          {
            name: "Оценка повреждений",
            description: "Осмотр и составление дефектовки",
            orderIndex: 1,
            estimatedHours: 1.0,
            isRequired: true,
          },
          {
            name: "Разборка и подготовка",
            description: "Демонтаж повреждённых элементов",
            orderIndex: 2,
            estimatedHours: 3.0,
            isRequired: true,
          },
          {
            name: "Рихтовочные работы",
            description: "Восстановление геометрии кузова",
            orderIndex: 3,
            estimatedHours: 8.0,
            isRequired: true,
          },
          {
            name: "Подготовка к покраске",
            description: "Шпатлёвка, грунтовка, шлифовка",
            orderIndex: 4,
            estimatedHours: 4.0,
            isRequired: true,
          },
          {
            name: "Покраска",
            description: "Нанесение краски и лака",
            orderIndex: 5,
            estimatedHours: 4.0,
            isRequired: true,
          },
          {
            name: "Полировка",
            description: "Финишная полировка кузова",
            orderIndex: 6,
            estimatedHours: 2.0,
            isRequired: false,
          },
          {
            name: "Сборка",
            description: "Установка элементов на место",
            orderIndex: 7,
            estimatedHours: 2.0,
            isRequired: true,
          },
        ],
      },
    },
  });

  console.log("✅ Шаблоны услуг созданы");

  // Создаем комплектующие на складе
  const inventoryItems = [
    {
      name: "Масло моторное 5W-30",
      category: "consumables",
      sku: "OIL-5W30-001",
      stock: 12,
      unit: "л",
      price: 25.50,
    },
    {
      name: "Фильтр масляный",
      category: "parts",
      sku: "FILTER-OIL-001",
      stock: 8,
      unit: "шт",
      price: 15.00,
    },
    {
      name: "Тормозные колодки передние",
      category: "parts",
      sku: "BRAKE-PAD-F-001",
      stock: 4,
      unit: "компл",
      price: 85.00,
    },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { sku: item.sku },
      update: {},
      create: item,
    });
  }

  console.log("✅ Комплектующие добавлены на склад");

  console.log("🎉 База данных успешно заполнена!");
}

main()
  .catch((e) => {
    console.error("❌ Ошибка при заполнении базы данных:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
