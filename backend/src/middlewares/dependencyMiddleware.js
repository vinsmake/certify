const dependencyMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // Admin ve todo, no se filtra
  if (req.user.role === 'admin') {
    req.dependencyFilter = null;
    return next();
  }

  // Emisor solo ve datos de su dependencia
  if (!req.user.dependency_id) {
    return res.status(403).json({ error: 'Usuario sin dependencia asignada' });
  }

  req.dependencyFilter = req.user.dependency_id;
  next();
};

module.exports = dependencyMiddleware;
