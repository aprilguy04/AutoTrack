/**
 * Сервис для работы с этапами заказа
 */
import { prisma } from "../../db/prisma.js";
import { saveBase64File } from "../../utils/file-storage.js";
import { notificationsService } from "../notifications/notifications.service.js";

export const stagesService = {
  /**
   * Создать этап (для администратора)
   */
  async createStage(orderId: string, data: {
    name: string;
    description?: string;
    orderIndex?: number;
    assignedTo?: string;
  }) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new Error("Заказ не найден");
    }

    let orderIndex = data.orderIndex;
    if (orderIndex === undefined) {
      const aggregate = await prisma.orderStage.aggregate({
        where: { orderId },
        _max: { orderIndex: true },
      });
      orderIndex = (aggregate._max.orderIndex ?? -1) + 1;
    }

    return prisma.orderStage.create({
      data: {
        orderId,
        name: data.name,
        description: data.description || null,
        orderIndex,
        status: "pending",
        assignedTo: data.assignedTo || null,
      },
      include: {
        mechanic: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Обновить этап (для администратора)
   */
  async updateStage(stageId: string, data: {
    name?: string;
    description?: string;
    status?: "pending" | "in_progress" | "done" | "blocked";
    assignedTo?: string | null;
    orderIndex?: number;
  }) {
    const existing = await prisma.orderStage.findUnique({
      where: { id: stageId },
      include: { order: true },
    });

    if (!existing) {
      throw new Error("Этап не найден");
    }

    const updatePayload: any = { ...data };
    if (data.assignedTo !== undefined && data.assignedTo !== existing.assignedTo) {
      updatePayload.assignedTo = data.assignedTo;
      updatePayload.lastViewedAt = null;
    }

    const updatedStage = await prisma.orderStage.update({
      where: { id: stageId },
      data: updatePayload,
      include: {
        mechanic: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (data.status && data.status !== existing.status) {
      if (data.status === "done" && existing.status !== "done") {
        try {
          await notificationsService.create({
            userId: existing.order.customerId,
            orderId: existing.orderId,
            type: "stage_done",
            title: "Этап завершен",
            message: `Этап "${existing.name}" завершен`,
            metadata: { stageId },
          });
        } catch (err) {
          console.warn("Failed to create stage_done notification (admin):", err);
        }
      }

      const allStages = await prisma.orderStage.findMany({
        where: { orderId: existing.orderId },
      });

      const allDone = allStages.every((s) => s.status === "done");
      const anyInProgress = allStages.some((s) => s.status === "in_progress");

      if (allDone) {
        await prisma.order.update({
          where: { id: existing.orderId },
          data: {
            status: "completed",
            completedAt: new Date(),
          },
        });
        try {
          await notificationsService.create({
            userId: existing.order.customerId,
            orderId: existing.orderId,
            type: "order_completed",
            title: "Заказ завершен",
            message: "Все этапы заказа завершены",
          });
        } catch (err) {
          console.warn("Failed to create order_completed notification (admin):", err);
        }
      } else if (anyInProgress && existing.order.status === "pending") {
        await prisma.order.update({
          where: { id: existing.orderId },
          data: {
            status: "in_progress",
          },
        });
      }
    }

    return updatedStage;
  },

  /**
   * Переупорядочить этапы
   */
  async reorderStages(orderId: string, updates: Array<{ stageId: string; orderIndex: number }>) {
    const transactions = updates.map((stage) =>
      prisma.orderStage.update({
        where: { id: stage.stageId, orderId },
        data: { orderIndex: stage.orderIndex },
      }),
    );
    await prisma.$transaction(transactions);
  },

  /**
   * Получить этапы заказа
   */
  async getOrderStages(orderId: string) {
    return prisma.orderStage.findMany({
      where: { orderId },
      include: {
        mechanic: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
          include: {
            uploadedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { orderIndex: "asc" },
    });
  },

  /**
   * Получить этап по ID
   */
  async getStageById(stageId: string) {
    return prisma.orderStage.findUnique({
      where: { id: stageId },
      include: {
        order: {
          select: {
            id: true,
            title: true,
            status: true,
            customer: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        mechanic: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
          include: {
            uploadedBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });
  },

  /**
   * Обновить статус этапа (для механика)
   */
  async updateStageStatus(
    stageId: string,
    mechanicId: string,
    data: {
      status: "pending" | "in_progress" | "done" | "blocked";
      comment?: string;
    },
  ) {
    console.log(`Updating stage ${stageId} by mechanic ${mechanicId}`, data);
    
    const stage = await prisma.orderStage.findUnique({
      where: { id: stageId },
      include: { order: true },
    });

    if (!stage) {
      console.error(`Stage ${stageId} not found`);
      throw new Error("Этап не найден");
    }

    // Проверяем, что этап назначен этому механику или заказ еще не назначен
    if (stage.assignedTo && stage.assignedTo !== mechanicId) {
      console.warn(`Stage ${stageId} is assigned to ${stage.assignedTo}, but mechanic ${mechanicId} tried to update`);
      throw new Error("Этап назначен другому механику");
    }

    const updateData: any = {
      status: data.status,
      assignedTo: mechanicId,
    };

    // Устанавливаем время начала, если этап переходит в работу
    if (data.status === "in_progress" && !stage.startedAt) {
      updateData.startedAt = new Date();
    }

    // Устанавливаем время завершения, если этап завершен
    if (data.status === "done" && !stage.completedAt) {
      updateData.completedAt = new Date();
    }

    // Если этап завершен, сбрасываем время начала если оно было
    if (data.status === "done" && stage.startedAt && !stage.completedAt) {
      updateData.completedAt = new Date();
    }

    const updatedStage = await prisma.orderStage.update({
      where: { id: stageId },
      data: updateData,
      include: {
        mechanic: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Добавляем комментарий, если указан
    if (data.comment) {
      await prisma.stageComment.create({
        data: {
          stageId: stageId,
          authorId: mechanicId,
          content: data.comment,
        },
      });
    }

    if (data.status === "done" && stage.status !== "done") {
      try {
        await notificationsService.create({
          userId: stage.order.customerId,
          orderId: stage.orderId,
          type: "stage_done",
          title: "Этап завершен",
          message: `Этап "${stage.name}" завершен`,
          metadata: { stageId },
        });
      } catch (err) {
        console.warn("Failed to create stage_done notification:", err);
      }
    }

    // Проверяем, все ли этапы завершены, чтобы обновить статус заказа
    const allStages = await prisma.orderStage.findMany({
      where: { orderId: stage.orderId },
    });

    const allDone = allStages.every((s) => s.status === "done");
    const anyInProgress = allStages.some((s) => s.status === "in_progress");

    if (allDone) {
      await prisma.order.update({
        where: { id: stage.orderId },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      });
      try {
        await notificationsService.create({
          userId: stage.order.customerId,
          orderId: stage.orderId,
          type: "order_completed",
          title: "Заказ завершен",
          message: "Все этапы заказа завершены",
        });
      } catch (err) {
        console.warn("Failed to create order_completed notification:", err);
      }
    } else if (anyInProgress && stage.order.status === "pending") {
      await prisma.order.update({
        where: { id: stage.orderId },
        data: {
          status: "in_progress",
        },
      });
    }

    return updatedStage;
  },

  /**
   * Добавить комментарий к этапу
   */
  async addComment(stageId: string, authorId: string, content: string) {
    return prisma.stageComment.create({
      data: {
        stageId,
        authorId,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  },

  /**
   * Добавить вложение к этапу
   */
  async addAttachment(stageId: string, uploadedById: string, payload: {
    base64: string;
    fileName?: string;
    description?: string;
    mimeType?: string;
  }) {
    const saved = await saveBase64File({
      base64: payload.base64,
      fileName: payload.fileName,
    });

    return prisma.stageAttachment.create({
      data: {
        stageId,
        uploadedById,
        fileName: payload.fileName || "attachment",
        filePath: saved.relativePath,
        fileSize: saved.size,
        mimeType: payload.mimeType || null,
        description: payload.description || null,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  },

  /**
   * Отметить этап прочитанным механиком
   */
  async markStageViewed(stageId: string, mechanicId: string) {
    const stage = await prisma.orderStage.findUnique({
      where: { id: stageId },
      select: { assignedTo: true },
    });

    if (!stage) {
      throw new Error("Этап не найден");
    }

    if (stage.assignedTo !== mechanicId) {
      throw new Error("Этап назначен другому механику");
    }

    return prisma.orderStage.update({
      where: { id: stageId },
      data: {
        lastViewedAt: new Date(),
      },
    });
  },

  /**
   * Получить назначенные заказы для механика
   */
  async getAssignedOrders(mechanicId: string) {
    console.log(`Getting assigned orders for mechanic ${mechanicId}`);
    
    const stages = await prisma.orderStage.findMany({
      where: { assignedTo: mechanicId },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                email: true,
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
                  orderBy: { createdAt: "desc" },
                  take: 3,
                  include: {
                    author: {
                      select: {
                        id: true,
                        fullName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Загружаем vehicleGeneration для каждого заказа
    for (const stage of stages) {
      if (stage.order.vehicleGenerationId) {
        try {
          const generation = await prisma.vehicleGeneration.findUnique({
            where: { id: stage.order.vehicleGenerationId },
            include: {
              model: {
                include: {
                  brand: true,
                },
              },
            },
          });
          (stage.order as any).vehicleGeneration = generation;
        } catch (err) {
          console.warn(`Could not load vehicle generation for order ${stage.order.id}:`, err);
        }
      }
    }

    // Группируем по заказам
    const orderMap = new Map();
    stages.forEach((stage) => {
      if (!orderMap.has(stage.orderId)) {
        orderMap.set(stage.orderId, {
          ...stage.order,
          assignedStages: [],
          timeline: stage.order.stages,
        });
      }
      orderMap.get(stage.orderId).assignedStages.push(stage);
    });

    const orders = Array.from(orderMap.values());
    console.log(`Found ${orders.length} assigned orders for mechanic ${mechanicId}`);
    return orders;
  },
};

