// controllers/auth.controller.js
const User = require("../models/user.js");
const Token = require("../models/token.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "access_secret";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";

const createAccessToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, ACCESS_TOKEN_SECRET, {
    expiresIn: "1d",
  });
};

const createRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, REFRESH_TOKEN_SECRET, { expiresIn: "1y" });
};

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email đã tồn tại." });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });

    return res.status(200).json({
      message: "Đăng ký thành công",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email không tồn tại." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu." });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    await Token.findOneAndUpdate(
      { user: user._id },
      { refreshToken },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "Đăng nhập thành công",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ message: "Thiếu refreshToken" });

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
    const savedToken = await Token.findOne({ user: decoded.id, refreshToken });
    if (!savedToken)
      return res.status(400).json({ message: "RefreshToken không hợp lệ" });

    const user = await User.findById(decoded.id);
    const newAccessToken = createAccessToken(user);

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    return res
      .status(400)
      .json({ message: "RefreshToken hết hạn hoặc không hợp lệ" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ message: "success", data: users });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi server khi lấy danh sách người dùng" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    res.status(200).json({ message: "success", data: user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi lấy người dùng" });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(400).json({ message: "Không tìm thấy người dùng" });

    user.is_active = !user.is_active;
    await user.save();

    res.status(200).json({
      message: "Đã cập nhật trạng thái người dùng",
      is_active: user.is_active,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái người dùng" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, avatar, phone, gender, dateOfBirth } = req.body;

    const user = await User.findById(userId);
    if (!user)
      return res.status(400).json({ message: "Không tìm thấy người dùng" });

    if (req.file && req.file.path) {
      user.avatar = `http://localhost:5000/uploads/avatars/${req.file.filename}`;
    }

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;

    await user.save();

    res.status(200).json({
      message: "Đã cập nhật thông tin cá nhân",
      data: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi cập nhật thông tin cá nhân", error });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res
        .status(400)
        .json({ message: "Vui lòng cung cấp đầy đủ mật khẩu cũ và mới." });

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Mật khẩu cũ không đúng" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi đổi mật khẩu", error });
  }
};
