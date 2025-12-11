import { Router } from "express";
import { z } from "zod";
import { authenticateToken, requireRole } from "../../middleware/auth.middleware.js";
import { ordersService } from "../orders/orders.service.js";
import { stagesService } from "../stages/stages.service.js";

const router = Router();
router.use(authenticateToken);

router.get("/:orderId/timeline", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await ordersService.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ message: "Заказ не найден" });
      return;
    }

    if (req.user!.role === "client" && order.customerId !== req.user!.id) {
      res.status(403).json({ message: "Нет доступа к заказу" });
      return;
    }

    const stages = await stagesService.getOrderStages(orderId);
    res.json({ stages });
  } catch (error) {
    console.error("Timeline error:", error);
    res.status(500).json({ message: "Не удалось загрузить прогресс" });
  }
});

const stageUpdateSchema = z.object({
  status: z.enum(["pending", "in_progress", "done", "blocked"]),
  comment: z.string().optional(),
});

router.post("/:orderId/stages/:stageId", requireRole("mechanic"), async (req, res) => {
  try {
    const body = stageUpdateSchema.parse(req.body);
    const stage = await stagesService.updateStageStatus(req.params.stageId, req.user!.id, body);
    res.json({ stage });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Ошибка валидации", errors: error.errors });
      return;
    }
    console.error("Progress update error:", error);
    res.status(500).json({ message: error.message || "Не удалось обновить этап" });
  }
});

export const progressRouter = router;