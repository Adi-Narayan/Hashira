import jwt from 'jsonwebtoken'

const authUser = async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.json({ success: false, message: 'Not Authorized. Login Again' });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = token_decode.id;  
    next();
  } catch (error) {
    console.log('JWT verification failed:', error.message);
    res.json({ success: false, message: error.message });
  }
};

export default authUser;
