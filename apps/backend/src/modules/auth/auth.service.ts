/**
 * Сервис аутентификации
 * Обрабатывает регистрацию, логин, генерацию JWT токенов
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { prisma } from "../../db/prisma.js";

export type UserRole = "guest" | "client" | "mechanic" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Хеширование пароля
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Проверка пароля
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Генерация JWT токена
 */
export function generateAccessToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  );
}

/**
 * Генерация refresh токена
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ id: userId, type: "refresh" }, env.JWT_SECRET, {
    expiresIn: "30d",
  });
}

/**
 * Верификация JWT токена
 */
export function verifyToken(token: string): { id: string; email: string; role: UserRole } | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      email: string;
      role: UserRole;
    };
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Регистрация нового пользователя
 */
export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
): Promise<AuthUser> {
  // Проверка существования пользователя
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error("Пользователь с таким email уже существует");
  }

  // Хеширование пароля
  const passwordHash = await hashPassword(password);

  // Создание пользователя
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      phone,
      role: "client", // По умолчанию клиент
    },
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as UserRole,
    phone: user.phone,
  };
}

/**
 * Авторизация пользователя
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<{ user: AuthUser; tokens: AuthTokens }> {
  // Поиск пользователя
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    throw new Error("Неверный email или пароль");
  }

  // Проверка пароля
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw new Error("Неверный email или пароль");
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as UserRole,
    phone: user.phone,
  };

  // Генерация токенов
  const tokens: AuthTokens = {
    accessToken: generateAccessToken(authUser),
    refreshToken: generateRefreshToken(user.id),
  };

  return { user: authUser, tokens };
}

/**
 * Получение пользователя по ID
 */
export async function getUserById(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as UserRole,
    phone: user.phone,
  };
}




