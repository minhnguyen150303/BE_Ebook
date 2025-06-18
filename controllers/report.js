const Book = require("../models/book");
const User = require("../models/user");
const Comment = require("../models/comment");
const mongoose = require("mongoose");

// Hàm tính ngày bắt đầu theo range (7d, 1m, 1y)
function getStartDateByRange(range) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  switch (range) {
    case "7d":
    case "1w":
      now.setDate(now.getDate() - 7);
      break;
    case "1m":
      now.setMonth(now.getMonth() - 1);
      break;
    case "1y":
      now.setFullYear(now.getFullYear() - 1);
      break;
    default:
      now.setDate(now.getDate() - 7); // Mặc định là 7 ngày gần nhất
  }
  return now;
}
exports.getOverview = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalComments = await Comment.countDocuments();
    const totalViews = await Book.aggregate([
      { $group: { _id: null, total: { $sum: "$views" } } },
    ]);

    res.json({
      success: true,
      data: {
        totalBooks,
        totalUsers,
        totalComments,
        totalViews: totalViews[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error("Lỗi khi lấy thống kê:", err);
    res.status(500).json({ message: "Lỗi server khi lấy thống kê." });
  }
};

exports.getBooksByCategoryStats = async (req, res) => {
  try {
    const stats = await Book.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $project: {
          _id: 0,
          categoryName: "$category.name",
          count: 1,
        },
      },
    ]);

    res.json({ success: true, data: stats });
  } catch (err) {
    console.error("Lỗi thống kê theo thể loại:", err);
    res.status(500).json({ message: "Lỗi server khi thống kê." });
  }
};

exports.getComment_wmy = async (req, res) => {
  try {
    const range = req.query.range || "7d";
    const startDate = getStartDateByRange(range);
    const bookId = req.query.bookId;

    const matchStage = { created_at: { $gte: startDate } };
    if (bookId) {
      matchStage.book = new mongoose.Types.ObjectId(bookId);
    }

    const comments = await Comment.aggregate([
      { $match: matchStage },

      // Join với bảng sách
      {
        $lookup: {
          from: "books",
          localField: "book",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: "$book" },

      // Join với bảng user nếu muốn lấy tên người bình luận
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 0,
          date: { $dateToString: { format: "%d-%m-%Y", date: "$created_at" } },
          content: 1,
          created_at: 1,
          bookTitle: "$book.title",
          bookAuthor: "$book.author",
          bookCover: "$book.cover",
          bookCategory: "$book.category",
          bookId: "$book._id",
          userName: "$user.name", // Có thể thay đổi tuỳ theo schema
        },
      },

      { $sort: { created_at: -1 } },
    ]);

    res.json({ success: true, data: comments });
  } catch (err) {
    console.error("Lỗi thống kê chi tiết bình luận:", err);
    res.status(500).json({ message: "Lỗi server khi thống kê bình luận." });
  }
};

exports.getNewUsers_wmy = async (req, res) => {
  try {
    const range = req.query.range || "7d";
    const startDate = getStartDateByRange(range);

    const stats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
          users: {
            $push: {
              _id: "$_id",
              name: "$name",
              email: "$email",
              created_at: "$createdAt",
            },
          },
        },
      },
      {
        $project: {
          year: "$_id.year",
          month: "$_id.month",
          count: 1,
          users: 1,
          _id: 0,
        },
      },
      { $sort: { year: -1, month: -1 } },
    ]);

    res.json({ success: true, data: stats });
  } catch (err) {
    console.error("Lỗi thống kê người dùng mới:", err);
    res.status(500).json({ message: "Lỗi server khi thống kê người dùng." });
  }
};
