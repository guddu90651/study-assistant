import multer from 'multer';
import path from 'path';

// Use memory storage for fast in-memory PDF parsing and chunking
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.txt', '.md', '.markdown'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext) || file.mimetype === 'application/pdf' || file.mimetype.startsWith('text/')) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}. Please upload a PDF or text/markdown document.`), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size
  },
  fileFilter,
});

export default upload;
