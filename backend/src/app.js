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

// Middleware global de manejo de errores (debe ser el ultimo)
app.use(errorHandler);

module.exports = app;
