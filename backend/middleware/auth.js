import jwt from 'jsonwebtoken'

const authUser = async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.json({ success: false, message: 'Please Signup/Login to place an order' });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    if (!token_decode?.id) {
      return res.json({ success: false, message: 'Session expired. Please login again.' });
    }
    req.userId = token_decode.id;
    next();
  } catch (error) {
    console.log('JWT verification failed:', error.message);
    res.json({ success: false, message: 'Session expired. Please login again.' });
  }
};

export default authUser;
