import multer from "multer";
import path from "path";
import fs from "fs";
import cloudinary from "../services/cloudinaryService";

// Define allowed MIME types for each file extension
const allowedMimeTypes: { [key: string]: string[] } = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  gif: ["image/gif"],
  webp: ["image/webp"],
  pdf: ["application/pdf"],
  svg: ["image/svg+xml"],
  doc: ["application/msword"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  dwg: ["application/acad", "application/x-acad", "image/vnd.dwg"],
  dxf: ["application/dxf", "image/vnd.dxf"],
  obj: ["model/obj", "text/plain"],
  stl: ["model/stl", "application/sla"],
  fbx: ["application/octet-stream"],
  "3ds": ["application/x-3ds", "image/x-3ds"],
  skp: ["application/vnd.sketchup.skp"],
  rvt: ["application/octet-stream"],
  ifc: ["application/x-step"],
  psd: ["image/vnd.adobe.photoshop", "application/octet-stream"],
  psb: ["image/vnd.adobe.photoshop", "application/octet-stream"],
};

const allowedExtensions = Object.keys(allowedMimeTypes);

class HybridCloudinaryStorage implements multer.StorageEngine {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  _handleFile(
    req: any,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void
  ): void {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50);
    const localFileName = `${file.fieldname}-${uniqueSuffix}-${safeBaseName}${ext}`;
    const localFilePath = path.join(this.uploadDir, localFileName);

    const outStream = fs.createWriteStream(localFilePath);
    file.stream.pipe(outStream);

    outStream.on("error", (err) => {
      cb(err);
    });

    outStream.on("finish", async () => {
      try {
        const stats = await fs.promises.stat(localFilePath);
        const fileSize = stats.size;

        // Try uploading to Cloudinary
        try {
          const result = await cloudinary.uploader.upload(localFilePath, {
            folder: "uploads",
            resource_type: "auto",
            public_id: `${file.fieldname}-${Date.now()}`,
          });

          // Cloudinary succeeded: remove local copy to save disk space
          await fs.promises.unlink(localFilePath).catch(() => {});

          return cb(null, {
            path: result.secure_url,
            filename: result.public_id,
            size: fileSize,
          });
        } catch (cloudErr: any) {
          console.warn(
            `[Cloudinary Fallback] Upload failed (${cloudErr?.http_code || cloudErr?.message || "error"}). Falling back to local storage: ${localFileName}`
          );

          // Build full URL for local file served from /uploads
          const protocol = req.headers?.["x-forwarded-proto"] || req.protocol || "http";
          const host = req.get ? req.get("host") : req.headers?.host || "localhost:4000";
          const baseUrl = process.env.BACKEND_URL || `${protocol}://${host}`;
          const localUrl = `${baseUrl}/uploads/${localFileName}`;

          return cb(null, {
            path: localUrl,
            filename: `local:${localFileName}`,
            size: fileSize,
          });
        }
      } catch (err) {
        cb(err);
      }
    });
  }

  _removeFile(
    req: any,
    file: Express.Multer.File,
    cb: (error: Error | null) => void
  ): void {
    try {
      if (file.filename && file.filename.startsWith("local:")) {
        const localName = file.filename.replace("local:", "");
        const localPath = path.join(this.uploadDir, localName);
        fs.unlink(localPath, () => cb(null));
      } else if (file.path && fs.existsSync(file.path)) {
        fs.unlink(file.path, () => cb(null));
      } else {
        cb(null);
      }
    } catch {
      cb(null);
    }
  }
}

// Updated file filter to check both extension and MIME type
const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (!allowedExtensions.includes(ext)) {
    cb(new Error("File extension not allowed"));
  } else if (
    allowedMimeTypes[ext] &&
    !allowedMimeTypes[ext].includes(file.mimetype) &&
    file.mimetype !== "application/octet-stream"
  ) {
    cb(new Error("MIME type does not match file extension"));
  } else {
    cb(null, true);
  }
};

// Initialize Multer with hybrid storage
const upload = multer({
  storage: new HybridCloudinaryStorage(),
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // Up to 50MB
});

export default upload;

