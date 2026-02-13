const User = require('../models/User');
const { hashPassword } = require('../utils/hashUtils');

const listUsers = async (req, res, next) => {
  try {
    let users;
    if (req.dependencyFilter) {
      users = await User.findByDependency(req.dependencyFilter);
    } else {
      users = await User.findAll();
    }
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { email, password, full_name, role, dependency_id } = req.body;

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'El email ya esta registrado' });
    }

    const password_hash = await hashPassword(password);

    const user = await User.create({
      email,
      password_hash,
      full_name,
      role,
      dependency_id: dependency_id || null,
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      dependency_id: user.dependency_id,
      is_active: user.is_active,
    });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, full_name, role, dependency_id, is_active } = req.body;

    if (email) {
      const existing = await User.findByEmail(email);
      if (existing && existing.id !== parseInt(id)) {
        return res.status(409).json({ error: 'El email ya esta registrado por otro usuario' });
      }
    }

    const user = await User.update(id, { email, full_name, role, dependency_id, is_active });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      dependency_id: user.dependency_id,
      is_active: user.is_active,
    });
  } catch (err) {
    next(err);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.deactivate(id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario desactivado', id: user.id });
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, createUser, updateUser, deactivateUser };
