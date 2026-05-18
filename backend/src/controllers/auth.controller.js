const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email y password son obligatorios' });
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, through: { attributes: [] } }],
    });

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const roles = (user.Roles || []).map((r) => r.name);
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      roles,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret-change-me', {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { login };
