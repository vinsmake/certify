const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// 31.09 - CORS solo permite el origen del frontend (antes de todo para cubrir rutas estaticas)
app.use(cors({
  origin: process.env.BASE_URL || 'http://localhost:5173',
  credentials: true,
}));

// 31.08 - Servir archivos estaticos ANTES de helmet para evitar bloqueo CORP
// (logos y firmas son publicos; PDFs solo via endpoint autenticado)
app.use('/storage/logos', express.static(path.join('/app', 'storage', 'logos')));
app.use('/storage/signatures', express.static(path.join('/app', 'storage', 'signatures')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Middlewares globales
app.use(helmet());

app.use(express.json());
app.use(morgan('dev'));

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/dependencies', require('./routes/dependencyRoutes'));
app.use('/api/templates', require('./routes/templateRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/participants', require('./routes/participantRoutes'));
app.use('/api/branding', require('./routes/brandingRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/verify', require('./routes/verificationRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/tags', require('./routes/tagRoutes'));

// Middleware global de manejo de errores (debe ser el ultimo)
app.use(errorHandler);

module.exports = app;
