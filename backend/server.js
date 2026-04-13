const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const path = require('path');

// Раздача загруженных файлов
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Защита: запрещаем выполнение скриптов из uploads
app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.path.endsWith('.js') || req.path.endsWith('.php') || req.path.endsWith('.exe')) {
    return res.status(403).send('Forbidden');
  }
  next();
});

// Роуты
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const topicRoutes = require('./routes/topics');
const lessonRoutes = require('./routes/lessons');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');
const gradeRoutes = require('./routes/grades');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/grades', gradeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// В конце server.js:
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Обработка ошибок
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Порт ${PORT} занят!`);
    console.error('💡 Выполните в PowerShell:');
    console.error('   taskkill /F /IM node.exe');
    process.exit(1);
  }
});

// Корректное завершение при Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал завершения...');
  server.close(() => {
    console.log('✅ Сервер остановлен');
    process.exit(0);
  });
});

