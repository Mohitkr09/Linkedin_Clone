// middleware/upload.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================================================
   📁 Local Upload Directory (for fallback/local storage)
============================================================ */
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

/* ============================================================
   🧠 MEMORY STORAGE (for Cloudinary)
   - Used for avatar uploads
   - Allows access to req.file.buffer
============================================================ */
export const memoryUpload = multer({
  storage: multer.memoryStorage(),
});

/* ============================================================
   💾 DISK STORAGE (optional - for posts/files)
============================================================ */
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

export const diskUpload = multer({ storage: diskStorage });
