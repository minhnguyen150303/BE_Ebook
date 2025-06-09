const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String },
    chapter_number: { type: Number, required: true },
  },
  { timestamps: false }
);
chapterSchema.index({ book: 1, chapter_number: 1 }, { unique: true });
// Đảm bảo mỗi chương số X chỉ có một bản ghi trong cùng một book_id
module.exports = mongoose.model("BookChapter", chapterSchema);
