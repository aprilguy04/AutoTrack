/**
 * Утилиты для сохранения файлов (например, вложения этапов)
 */
import crypto from "node:crypto";
import path from "node:path";
import { promises as fs } from "node:fs";

const uploadsRoot = path.resolve(process.cwd(), "uploads");

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export type SaveBase64FilePayload = {
  base64: string;
  fileName?: string;
  folder?: string;
};

export async function saveBase64File(payload: SaveBase64FilePayload): Promise<{
  relativePath: string;
  absolutePath: string;
  size: number;
}> {
  const { base64, fileName, folder = "stage-attachments" } = payload;

  const normalizedFolder = folder.replace(/(^\/+|\/+$)/g, "");
  const targetDir = path.join(uploadsRoot, normalizedFolder);
  await ensureDir(targetDir);

  let data = base64;
  const base64Parts = base64.split(",");
  if (base64Parts.length === 2 && base64Parts[0].startsWith("data:")) {
    data = base64Parts[1];
  }

  const buffer = Buffer.from(data, "base64");
  const safeName = fileName?.replace(/[^\w.\-]/g, "_") ?? `file-${Date.now()}`;
  const ext = path.extname(safeName) || ".bin";
  const randomSuffix = crypto.randomBytes(6).toString("hex");
  const finalFileName = `${path.basename(safeName, ext)}-${randomSuffix}${ext}`;
  const absolutePath = path.join(targetDir, finalFileName);
  await fs.writeFile(absolutePath, buffer);

  const relativePath = `/uploads/${normalizedFolder}/${finalFileName}`;

  return {
    relativePath,
    absolutePath,
    size: buffer.length,
  };
}

