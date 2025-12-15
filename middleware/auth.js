const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    // console.log('No token provided in request');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log('Token decoded successfully:', { adminId: decoded.id, email: decoded.email });
    req.admin = decoded;
    next();
  } catch (error) {
    // console.error('Token verification failed:', error.message);
    res.status(401).json({ message: 'Token is not valid', error: error.message });
  }
};

module.exports = auth;