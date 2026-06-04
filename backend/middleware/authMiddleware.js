const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.toString().toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authorization token missing',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        status: 'error',
        message: 'JWT secret not configured',
      });
    }

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          status: 'error',
          message: 'Invalid or expired token',
        });
      }

      // Attach full decoded payload (id, role, iat, exp, etc.)
      req.user = decoded;

      return next();
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed',
      error: err.message,
    });
  }
}

module.exports = authMiddleware;

