import jwt from 'jsonwebtoken'

const adminAuth = async (req, resizeBy, next) => {

try{
    const {token} = req.headers
    if(!token) {
        return resizeBy.json({success:false, message:"Not Authorized Login Again"})
    }
    const token_decode = jwt.verify(token, process.env.JWT_secret);
    if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
        return resizeBy.json({success:false,message:"Not Authorized Login Again"})
    }
    next()
}
catch (error) {
    console.log(error);
    res.json({success:false, message:error.message})
}

}

export default adminAuth