const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    last_page: { type: Number, default: 1 },
  },
  { timestamps: false }
);

module.exports = mongoose.model("Bookmark", bookmarkSchema);
