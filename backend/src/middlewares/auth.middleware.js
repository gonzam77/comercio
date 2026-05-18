const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');
    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Token invalido' });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];
    const allowed = roles.some((role) => userRoles.includes(role));
    if (!allowed) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    return next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
};
