import jwt from 'jsonwebtoken';

const adminAuth = async (req, res, next) => {
  try {
    const { token } = req.headers;
    if (!token) {
      return res.json({ success: false, message: "Not Authorized Login Again" }); // ✅ fixed: was resizeBy
    }

    const token_decode = jwt.verify(token, process.env.JWT_SECRET); // ✅ fixed: env key capitalization

    if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      return res.json({ success: false, message: "Not Authorized Login Again" }); // ✅ fixed: was resizeBy
    }

    next();
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message }); // ✅ fixed: make sure res is defined
  }
};

export default adminAuth;
