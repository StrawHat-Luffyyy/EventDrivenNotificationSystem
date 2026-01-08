const internalAuthMiddleware = (req, res, next) => {
  const token = req.headers['x-internal-token'];
  if(!token || token !== process.env.INTERNAL_SERVICE_TOKEN) {
    return res.status(403).json({ message: 'Forbidden: Invalid internal token' });
  }
  next();
}

export default internalAuthMiddleware;