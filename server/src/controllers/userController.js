// Data Model
const { User, Tenant, UserTenant } = require('../models');

// Bcrypt library for JWT
const bcrypt = require('bcrypt');

// Import the JWT generate utility
const { generateJWT } = require('../utils/jwtUtils');

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { first_name, last_name, email, password, role } = req.body;
    const tenantId = req.tenant?.id;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Este correo ya está registrado' });
    }

    // Hash the password before saving the user
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      role
    });

    // Ensure membership record
    if (tenantId) {
      await UserTenant.findOrCreate({ where: { user_id: user.id, tenant_id: tenantId }, defaults: { role: role || 'staff' } });
    }

    res.status(201).json({ message: 'Usuario registrado correctamente', data: user });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar el usuario: ' + error.message });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const memberships = await UserTenant.findAll({ where: { tenant_id: tenantId }, attributes: ['user_id'] });
    const userIds = memberships.map(m => m.user_id);

    if (userIds.length === 0) {
      return res.status(404).json({ message: 'No hay usuarios registrados' });
    }

    const users = await User.findAll({ where: { id: userIds } });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios: ' + error.message });
  }
};

// Get a user by ID
exports.getUserById = async (req, res) => {
  try {
    const tenantId = req.tenant?.id;
    const userId = req.params.id;
    const membership = await UserTenant.findOne({ where: { tenant_id: tenantId, user_id: userId } });
    if (!membership) {
      return res.status(404).json({ message: "El usuario no fue encontrado" });
    }

    const user = await User.findByPk(userId);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el usuario: ' + error.message });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password } = req.body;

    // Verify if email is already in use by another user (if provided)
    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail && existingEmail.id !== parseInt(id)) {
        return res.status(409).json({ message: 'Este correo electrónico ya está registrado' });
      }
    }

    // If a new password is provided, hash it before saving
    if (password) {
      req.body.password = await bcrypt.hash(password, 10);
    }

    // Update the user with the provided data
    const tenantId = req.tenant?.id;
    const membership = await UserTenant.findOne({ where: { tenant_id: tenantId, user_id: id } });
    if (!membership) {
      return res.status(404).json({ message: 'El usuario no fue encontrado' });
    }

    const [updated] = await User.update(req.body, { where: { id } });
    if (updated) {
      const updatedUser = await User.findByPk(id);
      return res.status(200).json({ message: 'Usuario actualizado correctamente', data: updatedUser });
    }

    throw new Error('User not found');
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el usuario: ' + error.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant?.id;
    const membership = await UserTenant.findOne({ where: { tenant_id: tenantId, user_id: id } });
    if (!membership) {
      return res.status(404).json({ message: "El usuario no fue encontrado" });
    }

    await membership.destroy();
    const remaining = await UserTenant.count({ where: { user_id: id } });
    if (remaining === 0) {
      await User.destroy({ where: { id } });
    }

    return res.status(200).json({ message: "El usuario fue eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el usuario: ' + error.message });
  }
};