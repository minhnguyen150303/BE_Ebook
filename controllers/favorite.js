// POST /favorites/toggle/:bookId
const Favorite = require("../models/favorite");
const Book = require("../models/book");

const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const bookId = req.params.bookId;

    // Kiểm tra sách tồn tại không
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Không tìm thấy sách." });

    // Tìm xem đã yêu thích chưa
    const existingFavorite = await Favorite.findOne({
      user: userId,
      book: bookId,
    });

    if (existingFavorite) {
      // Nếu đã yêu thích -> Xoá để bỏ yêu thích
      await Favorite.findByIdAndDelete(existingFavorite._id);
      return res.status(200).json({
        success: true,
        is_favorite: false,
        message: "Đã bỏ yêu thích.",
      });
    } else {
      // Nếu chưa yêu thích -> Thêm vào
      await Favorite.create({ user: userId, book: bookId });
      return res.status(201).json({
        success: true,
        is_favorite: true,
        message: "Đã thêm vào yêu thích.",
      });
    }
  } catch (error) {
    console.error("Lỗi toggle yêu thích:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).populate(
      "book"
    );
    res.status(200).json({ success: true, favorites });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách yêu thích:", error);
    res.status(500).json({ message: "Lỗi server." });
  }
};

module.exports = {
  toggleFavorite,
  getFavorites,
};
