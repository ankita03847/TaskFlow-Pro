const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Ensure uploads directory exists (uses /tmp on Vercel serverless since /var/task is read-only)
const isServerless = !!process.env.VERCEL;
const uploadDir = isServerless
  ? path.join(os.tmpdir(), 'uploads')
  : fs.existsSync(path.join(__dirname, '../Uploads'))
    ? path.join(__dirname, '../Uploads')
    : path.join(__dirname, '../uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn("Upload directory check:", err.message);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter (checks both MIME type and file extension)
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/pjpeg',
    'image/x-png',
    'image/jfif',
    'image/svg+xml',
  ];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.jfif', '.svg'];

  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  const isMimeAllowed = allowedMimes.includes(mime) || mime.startsWith('image/');
  const isExtAllowed = allowedExtensions.includes(ext);

  // Accept if valid image MIME OR if valid image extension (even if Postman/Windows sends application/octet-stream)
  if (isMimeAllowed || (isExtAllowed && (mime === 'application/octet-stream' || !mime))) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Only image files (.jpeg, .jpg, .png, .webp, .gif) are allowed. Received: "${file.originalname}" (MIME: ${file.mimetype || 'unknown'}, extension: ${ext || 'none'})`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
});

module.exports = upload;