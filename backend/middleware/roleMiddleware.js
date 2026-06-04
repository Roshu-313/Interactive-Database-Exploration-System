function roleMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !user.role) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied: missing user role',
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied: insufficient permissions',
      });
    }

    return next();
  };
}

module.exports = roleMiddleware;

