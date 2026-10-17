import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { existsSync } from "fs";
import { AppError } from "@/lib/errors";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Validates and saves an uploaded image file securely to public/uploads.
 */
export async function saveUploadedImage(
  file: File,
  folder = "uploads"
): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new AppError("Ukuran file melebihi batas maksimal 5MB", 400);
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new AppError("Format file tidak didukung. Gunakan JPG, PNG, atau WebP", 400);
  }

  const rawExt = extname(file.name).toLowerCase();
  const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : ".jpg";

  const uploadDir = join(process.cwd(), "public", folder);
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Generate safe sanitized filename
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const safeBaseName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 30);

  const fileName = `${timestamp}-${safeBaseName}-${randomSuffix}${ext}`;
  const filePath = join(uploadDir, fileName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  return `/${folder}/${fileName}`;
}
