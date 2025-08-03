import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.token;
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) return res.status(401).json({ success: false, message: 'Invalid token' });

    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error('JWT error:', err);
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
};

export default authMiddleware;
