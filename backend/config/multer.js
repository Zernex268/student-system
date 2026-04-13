const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Создаём папку для загрузок, если нет
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(path.join(uploadDir, 'submissions'), { recursive: true });
  fs.mkdirSync(path.join(uploadDir, 'assignments'), { recursive: true });
  fs.mkdirSync(path.join(uploadDir, 'topics'), { recursive: true });
}

// Конфигурация хранения
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // ✅ Определяем тип загрузки из URL параметра или body
    let type = req.params.type || req.body.type || req.body.uploadType;
    
    // Если тип не указан, определяем по URL
    if (!type) {
      const url = req.originalUrl;
      if (url.includes('/topics/')) type = 'topics';
      else if (url.includes('/assignments/')) type = 'assignments';
      else if (url.includes('/submissions/')) type = 'submissions';
      else type = 'general'; // fallback
    }
    
    const dest = path.join(uploadDir, type);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-z0-9а-яё_-]/gi, '_');
    cb(null, `${unique}-${safeName}${ext}`);
  }
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  const allowed = [
    // Документы
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain', 
    'text/markdown',
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    // Изображения
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Архивы
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    // Видео/аудио
    'video/mp4', 'audio/mpeg',
    // Код
    'application/json', 'text/javascript', 'text/x-python', 'text/x-java-source'
  ];
  
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Недопустимый тип файла: ${file.mimetype}. Разрешены: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, изображения, видео`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB
  }
});

module.exports = upload;