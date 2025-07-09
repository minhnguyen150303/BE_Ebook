const Comment = require("../models/comment");

exports.createComment = async (req, res) => {
  try {
    const { book, rating, comment } = req.body;

    const newComment = await Comment.create({
      user: req.user._id,
      book,
      rating,
      comment,
    });

    await newComment.populate("user", "name avatar is_active role");

    req.io.to(book).emit("new-comment", newComment);

    res.status(201).json({ success: true, comment: newComment });
  } catch (err) {
    console.error("Lỗi tạo bình luận:", err);
    res.status(500).json({ message: "Lỗi server khi tạo bình luận." });
  }
};

exports.getCommentsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const comments = await Comment.find({ book: bookId, is_hidden: false })
      .populate("user", "name avatar is_active role")
      .sort({ created_at: -1 });

    res.json({ success: true, comments });
  } catch (err) {
    console.error("Lỗi lấy bình luận:", err);
    res.status(500).json({ message: "Lỗi server khi lấy bình luận." });
  }
};

exports.getAllCommentsByBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const comments = await Comment.find({ book: bookId })
      .populate("user", "name avatar is_active role")
      .sort({ created_at: -1 });

    res.json({ success: true, comments });
  } catch (err) {
    console.error("Lỗi lấy bình luận:", err);
    res.status(500).json({ message: "Lỗi server khi lấy bình luận." });
  }
};
exports.updateComment = async (req, res) => {
  try {
    const { comment, rating } = req.body;
    const commentId = req.params.id;

    const existingComment = await Comment.findById(commentId);
    if (!existingComment)
      return res.status(404).json({ message: "Không tìm thấy bình luận." });

    // Chỉ cho phép chính chủ sửa bình luận
    if (existingComment.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền sửa bình luận này." });
    }

    if (comment !== undefined) existingComment.comment = comment;
    if (rating !== undefined) existingComment.rating = rating;

    await existingComment.save();
    await existingComment.populate("user", "name avatar is_active role");

    req.io
      .to(existingComment.book.toString())
      .emit("comment-updated", existingComment);

    res.json({
      success: true,
      message: "Cập nhật bình luận thành công.",
      comment: existingComment,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi cập nhật bình luận." });
  }
};

exports.toggleComment = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin mới được ẩn/hiện bình luận." });
    }

    const commentId = req.params.id;
    const comment = await Comment.findById(commentId);

    if (!comment)
      return res.status(404).json({ message: "Không tìm thấy bình luận." });

    comment.is_hidden = !comment.is_hidden;
    await comment.save();

    await comment.populate("user", "name avatar is_active role");
    req.io.to(comment.book.toString()).emit("comment-updated", comment);

    res.json({
      success: true,
      message: `Đã ${comment.is_hidden ? "ẩn" : "hiện"} bình luận.`,
      is_hidden: comment.is_hidden,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi ẩn/hiện bình luận." });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const comment = await Comment.findByIdAndDelete(commentId);
    if (req.user.role !== "admin" && comment.user.toString() !== req.user.id)
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa bình luận." });

    const book = comment.book.toString();
    await comment.deleteOne();

    req.io.to(book).emit("comment-deleted", { id: commentId });

    res.json({ success: true, message: "Đã xóa bình luận." });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi xóa bình luận." });
  }
};
