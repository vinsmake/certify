const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares globales
app.use(helmet());
app.use(cors());
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

// Middleware global de manejo de errores (debe ser el ultimo)
app.use(errorHandler);

module.exports = app;
