import multer from 'multer';
import path from 'path';

// Define allowed MIME types for each file extension
const allowedMimeTypes: { [key: string]: string[] } = {
  'jpg': ['image/jpeg'],
  'jpeg': ['image/jpeg'],
  'png': ['image/png'],
  'gif': ['image/gif'],
  'webp': ['image/webp'],
  'pdf': ['application/pdf'],
  'svg': ['image/svg+xml'],
  'doc': ['application/msword'],
  'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'xls': ['application/vnd.ms-excel'],
  'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  'dwg': ['application/acad', 'application/x-acad', 'image/vnd.dwg'],
  'dxf': ['application/dxf', 'image/vnd.dxf'],
  'obj': ['model/obj', 'text/plain'],
  'stl': ['model/stl', 'application/sla'],
  'fbx': ['application/octet-stream'],
  '3ds': ['application/x-3ds', 'image/x-3ds'],
  'skp': ['application/vnd.sketchup.skp'],
  'rvt': ['application/octet-stream'],
  'ifc': ['application/x-step'],
  'psd': ['image/vnd.adobe.photoshop', 'application/octet-stream'],
  'psb': ['image/vnd.adobe.photoshop', 'application/octet-stream'],
};

const allowedExtensions = Object.keys(allowedMimeTypes);

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname).toLowerCase().slice(1);
    cb(null, `${file.fieldname}-${uniqueSuffix}.${extension}`);
  },
});

// Updated file filter to check both extension and MIME type
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (!allowedExtensions.includes(ext)) {
    cb(new Error('File extension not allowed'));
  } else if (!allowedMimeTypes[ext].includes(file.mimetype)) {
    cb(new Error('MIME type does not match file extension'));
  } else {
    cb(null, true);
  }
};

// Initialize Multer with storage, filter, and increased size limit
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // Up to 50MB
});

export default upload;