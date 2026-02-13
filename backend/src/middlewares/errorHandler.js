const environment = require('../config/environment');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (environment.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Error interno del servidor';

  res.status(statusCode).json({
    error: message,
    ...(environment.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
