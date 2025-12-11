/**
 * Middleware для аутентификации и авторизации
 */
import type { Request, Response, NextFunction } from "express";
import { verifyToken, getUserById, type UserRole } from "../modules/auth/auth.service.js";

// Расширяем тип Request для хранения пользователя
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Middleware для проверки JWT токена
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Получаем токен из заголовка Authorization или из cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (!token) {
      res.status(401).json({ message: "Токен доступа не предоставлен" });
      return;
    }

    // Верификация токена
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ message: "Недействительный токен" });
      return;
    }

    // Проверяем, что пользователь существует и активен
    const user = await getUserById(decoded.id);
    if (!user) {
      res.status(401).json({ message: "Пользователь не найден или неактивен" });
      return;
    }

    // Сохраняем данные пользователя в запросе
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Ошибка аутентификации" });
  }
}

/**
 * Middleware для проверки роли пользователя
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Требуется аутентификация" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: "Недостаточно прав доступа",
        required: allowedRoles,
        current: req.user.role,
      });
      return;
    }

    next();
  };
}

/**
 * Опциональная аутентификация (не блокирует запрос, но добавляет user если токен валиден)
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await getUserById(decoded.id);
        if (user) {
          req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
          };
        }
      }
    }
  } catch {
    // Игнорируем ошибки при опциональной аутентификации
  }
  next();
}




