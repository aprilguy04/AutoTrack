/**
 * Роутер аутентификации
 * POST /api/auth/register - регистрация
 * POST /api/auth/login - вход
 * POST /api/auth/logout - выход
 * GET /api/auth/me - текущий пользователь
 * POST /api/auth/refresh - обновление токена
 * PATCH /api/auth/profile - обновление профиля
 * POST /api/auth/change-password - смена пароля
 * DELETE /api/auth/account - удаление аккаунта
 */
import { Router } from "express";
import { z } from "zod";
import {
  loginUser,
  registerUser,
  getUserById,
  verifyToken,
  generateAccessToken,
  updateUserProfile,
  changeUserPassword,
  deleteUserAccount,
} from "./auth.service.js";
import { authenticateToken } from "../../middleware/auth.middleware.js";

const router = Router();

// Схемы валидации
const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  fullName: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Пароль обязателен"),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Имя должно содержать минимум 2 символа").optional(),
  phone: z.string().optional(),
  email: z.string().email("Некорректный email").optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Текущий пароль обязателен"),
  newPassword: z.string().min(6, "Новый пароль должен содержать минимум 6 символов"),
});

/**
 * Регистрация нового пользователя
 */
router.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const user = await registerUser(data.email, data.password, data.fullName, data.phone);

    res.status(201).json({
      message: "Пользователь успешно зарегистрирован",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }

    if (error.message === "Пользователь с таким email уже существует") {
      res.status(409).json({ message: error.message });
      return;
    }

    console.error("Registration error:", error);
    res.status(500).json({ message: "Ошибка при регистрации" });
  }
});

/**
 * Вход в систему
 */
router.post("/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const { user, tokens } = await loginUser(data.email, data.password);

    // Устанавливаем токены в cookies
    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
    });

    res.json({
      message: "Успешный вход",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
      },
      tokens,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }

    if (error.message === "Неверный email или пароль") {
      res.status(401).json({ message: error.message });
      return;
    }

    console.error("Login error:", error);
    res.status(500).json({ message: "Ошибка при входе" });
  }
});

/**
 * Выход из системы
 */
router.post("/logout", authenticateToken, (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Успешный выход" });
});

/**
 * Получение текущего пользователя
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "Пользователь не найден" });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ message: "Ошибка при получении данных пользователя" });
  }
});

/**
 * Обновление access токена
 */
router.post("/refresh", async (req, res) => {
  try {
    const data = refreshSchema.parse(req.body);
    const refreshToken = data.refreshToken || req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ message: "Refresh токен не предоставлен" });
      return;
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded || (decoded as any).type !== "refresh") {
      res.status(401).json({ message: "Недействительный refresh токен" });
      return;
    }

    const user = await getUserById(decoded.id);
    if (!user) {
      res.status(401).json({ message: "Пользователь не найден" });
      return;
    }

    const newAccessToken = generateAccessToken(user);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken: newAccessToken,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }

    res.status(401).json({ message: "Ошибка при обновлении токена" });
  }
});

/**
 * Обновление профиля пользователя
 */
router.patch("/profile", authenticateToken, async (req, res) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    const user = await updateUserProfile(req.user!.id, data);

    res.json({
      message: "Профиль успешно обновлён",
      user,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }

    if (error.message === "Пользователь с таким email уже существует") {
      res.status(409).json({ message: error.message });
      return;
    }

    console.error("Update profile error:", error);
    res.status(500).json({ message: "Ошибка при обновлении профиля" });
  }
});

/**
 * Смена пароля
 */
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const data = changePasswordSchema.parse(req.body);

    await changeUserPassword(req.user!.id, data.currentPassword, data.newPassword);

    res.json({ message: "Пароль успешно изменён" });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Ошибка валидации",
        errors: error.errors,
      });
      return;
    }

    if (error.message === "Неверный текущий пароль") {
      res.status(400).json({ message: error.message });
      return;
    }

    console.error("Change password error:", error);
    res.status(500).json({ message: "Ошибка при смене пароля" });
  }
});

/**
 * Удаление аккаунта
 */
router.delete("/account", authenticateToken, async (req, res) => {
  try {
    await deleteUserAccount(req.user!.id);

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.json({ message: "Аккаунт успешно удалён" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: "Ошибка при удалении аккаунта" });
  }
});

export const authRouter = router;
