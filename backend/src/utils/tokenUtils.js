const jwt = require('jsonwebtoken');
const environment = require('../config/environment');

const generateToken = (payload) => {
  return jwt.sign(payload, environment.JWT_SECRET, {
    expiresIn: environment.JWT_EXPIRATION,
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, environment.JWT_SECRET);
};

module.exports = { generateToken, verifyToken };
