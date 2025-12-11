import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.middleware.js";
import { notificationsService } from "./notifications.service.js";

const router = Router();

router.use(authenticateToken);

router.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const notifications = await notificationsService.getUserFeed(userId);
    res.json({ notifications });
  } catch (error) {
    console.error("Notifications list error:", error);
    res.status(500).json({ message: "Не удалось загрузить уведомления" });
  }
});

router.post("/:id/read", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await notificationsService.markAsRead(id, userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Notification read error:", error);
    res.status(500).json({ message: "Не удалось обновить уведомление" });
  }
});

router.post("/read-all", async (req, res) => {
  try {
    const userId = req.user!.id;
    await notificationsService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Notification read-all error:", error);
    res.status(500).json({ message: "Не удалось обновить уведомления" });
  }
});

export const notificationsRouter = router;