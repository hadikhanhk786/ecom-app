const jwt = require('jsonwebtoken');

module.exports = function buyerAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'buyer') {
      return res.status(403).json({ message: 'Forbidden: Not a buyer' });
    }
    req.user = decoded; // attach buyer info to request
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid Token' });
  }
};
