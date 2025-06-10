// middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const User = require("../models/user");
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
  if (!token) return res.status(401).json({ message: "Bạn chưa đăng nhập." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user)
      return res.status(401).json({ message: "Người dùng không tồn tại." });

    req.user = user;

    next();
  } catch (err) {
    return res.status(403).json({ message: "Token không hợp lệ." });
  }
};

module.exports = authMiddleware;
