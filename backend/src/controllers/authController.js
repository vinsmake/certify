const User = require('../models/User');
const { comparePassword } = require('../utils/hashUtils');
const { generateToken } = require('../utils/tokenUtils');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Usuario desactivado' });
    }

    const isMatch = await comparePassword(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      dependency_id: user.dependency_id,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        dependency_id: user.dependency_id,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      dependency_id: user.dependency_id,
      dependency_name: user.dependency_name,
      is_active: user.is_active,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe };
