/**
 * Сервис для работы с заказами
 */
import { prisma } from "../../db/prisma.js";

export const ordersService = {
  /**
   * Создать новый заказ
   */
  async createOrder(data: {
    title?: string;
    description?: string;
    customerId: string;
    vehicleGenerationId?: string;
    vehicleYear?: number;
    vehicleInfo?: string;
    serviceType: string;
    serviceTypeOther?: string;
    serviceTemplateId?: string;
  }) {
    // Формируем заголовок заказа, если не указан
    let title = data.title || "";
    if (!title && data.vehicleGenerationId) {
      try {
        const generation = await prisma.vehicleGeneration.findUnique({
          where: { id: data.vehicleGenerationId },
          include: {
            model: {
              include: {
                brand: true,
              },
            },
          },
        });
        if (generation) {
          title = `${generation.model.brand.name} ${generation.model.name} ${generation.nameRu || generation.name}`;
          if (data.vehicleYear) {
            title += ` ${data.vehicleYear}`;
          }
        }
      } catch (err) {
        console.warn("Could not load vehicle generation for title:", err);
        // Продолжаем без заголовка из поколения
      }
    }

    // Если указан serviceTemplateId, получаем шаблоны этапов
    let stageTemplates: any[] = [];
    if (data.serviceTemplateId) {
      try {
        const serviceTemplate = await prisma.serviceTemplate.findUnique({
          where: { id: data.serviceTemplateId },
          include: {
            stageTemplates: {
              orderBy: { orderIndex: "asc" },
            },
          },
        });
        if (serviceTemplate) {
          stageTemplates = serviceTemplate.stageTemplates;
          console.log(`Found ${stageTemplates.length} stage templates for service ${data.serviceTemplateId}`);
        } else {
          console.warn(`Service template ${data.serviceTemplateId} not found`);
        }
      } catch (err) {
        console.error("Error loading service template:", err);
        // Продолжаем без этапов из шаблона
      }
    }

    // Подготавливаем данные для создания заказа
    const orderData: any = {
      title: title || "Новый заказ",
      description: data.description || null,
      customerId: data.customerId,
      vehicleGenerationId: data.vehicleGenerationId || null,
      vehicleYear: data.vehicleYear || null,
      vehicleInfo: data.vehicleInfo || null,
      serviceType: data.serviceType,
      serviceTypeOther: data.serviceTypeOther || null,
      serviceTemplateId: data.serviceTemplateId || null,
      status: "pending",
    };

    // Добавляем этапы только если есть шаблоны
    if (stageTemplates.length > 0) {
      orderData.stages = {
        create: stageTemplates.map((template) => ({
          name: template.name,
          description: template.description || null,
          orderIndex: template.orderIndex,
          status: "pending",
          stageTemplateId: template.id,
        })),
      };
    }

    // Создаем заказ
    const order = await prisma.order.create({
      data: orderData,
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        stages: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    // Загружаем vehicleGeneration отдельно, если нужно
    if (order.vehicleGenerationId) {
      try {
        const generation = await prisma.vehicleGeneration.findUnique({
          where: { id: order.vehicleGenerationId },
          include: {
            model: {
              include: {
                brand: true,
              },
            },
          },
        });
        (order as any).vehicleGeneration = generation;
      } catch (err) {
        console.warn("Could not load vehicle generation:", err);
      }
    }

    return order;
  },

  /**
   * Получить заказы пользователя
   */
  async getOrdersByCustomer(customerId: string) {
    try {
      const orders = await prisma.order.findMany({
        where: { customerId },
        include: {
          stages: {
            orderBy: { orderIndex: "asc" },
            include: {
              mechanic: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Загружаем vehicleGeneration для каждого заказа отдельно
      for (const order of orders) {
        if (order.vehicleGenerationId) {
          try {
            const generation = await prisma.vehicleGeneration.findUnique({
              where: { id: order.vehicleGenerationId },
              include: {
                model: {
                  include: {
                    brand: true,
                  },
                },
              },
            });
            (order as any).vehicleGeneration = generation;
          } catch (err) {
            console.warn(`Could not load vehicle generation for order ${order.id}:`, err);
          }
        }
      }

      return orders;
    } catch (error: any) {
      console.error("Error in getOrdersByCustomer:", error);
      // Если ошибка связана с отсутствием таблицы или колонки, возвращаем пустой массив
      if (error.code === "P2021" || error.code === "P2025") {
        console.warn("Database schema mismatch, returning empty array");
        return [];
      }
      throw error;
    }
  },

  /**
   * Получить все заказы для администратора
   */
  async getOrdersForAdmin() {
    const orders = await prisma.order.findMany({
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        stages: {
          orderBy: { orderIndex: "asc" },
          include: {
            mechanic: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            comments: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    for (const order of orders) {
      if (order.vehicleGenerationId) {
        try {
          const generation = await prisma.vehicleGeneration.findUnique({
            where: { id: order.vehicleGenerationId },
            include: {
              model: {
                include: {
                  brand: true,
                },
              },
            },
          });
          (order as any).vehicleGeneration = generation;
        } catch (err) {
          console.warn(`Could not load vehicle generation for admin order ${order.id}:`, err);
        }
      }
    }

    return orders;
  },

  /**
   * Отметить заказ просмотренным администратором
   */
  async markViewedByAdmin(orderId: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        adminLastViewedAt: new Date(),
      },
    });
  },

  /**
   * Получить заказ по ID
   */
  async getOrderById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        stages: {
          orderBy: { orderIndex: "asc" },
          include: {
            mechanic: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    // Загружаем vehicleGeneration отдельно, если нужно
    if (order.vehicleGenerationId) {
      try {
        const generation = await prisma.vehicleGeneration.findUnique({
          where: { id: order.vehicleGenerationId },
          include: {
            model: {
              include: {
                brand: true,
              },
            },
          },
        });
        (order as any).vehicleGeneration = generation;
      } catch (err) {
        console.warn("Could not load vehicle generation:", err);
      }
    }

    return order;
  },
};

