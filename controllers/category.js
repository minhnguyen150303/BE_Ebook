const Category = require("../models/category");
const Book = require("../models/book");
const fs = require("fs");
const BookChapter = require("../models/bookChapter");

// Tạo category mới
const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const newCategory = new Category({ name });
    await newCategory.save();
    res
      .status(201)
      .json({ message: "Đã tạo thành công", category: newCategory });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Category đã tồn tại" });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
};
//lấy danh sách category
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }); // sắp xếp theo tên A-Z
    res.status(200).json({
      success: "true",
      categories,
    });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Xóa category theo ID
// const deleteCategory = async (req, res) => {
//   try {
//     const deleted = await Category.findByIdAndDelete(req.params.id);
//     if (!deleted) {
//       return res.status(404).json({ error: "Category không tìm thấy" });
//     }
//     res.status(200).json({ message: "Category đã xóa" });
//   } catch (error) {
//     res.status(500).json({ error: "Something went wrong" });
//   }
// };

const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // 1. Lấy toàn bộ sách thuộc category này
    const books = await Book.find({ category: categoryId });

    for (const book of books) {
      // 2. Xóa file ảnh bìa và file sách nếu có
      const deleteFileIfExists = (filePath) => {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      };

      deleteFileIfExists(book.cover_url?.replace("http://localhost:5000", "./public"));
      deleteFileIfExists(book.file_url?.replace("http://localhost:5000", "./public"));

      // 3. Xóa chương
      await BookChapter.deleteMany({ book: book._id });

      // 4. Xóa sách
      await Book.findByIdAndDelete(book._id);
    }

    // 5. Xóa thể loại
    const deletedCategory = await Category.findByIdAndDelete(categoryId);
    if (!deletedCategory) {
      return res.status(404).json({ error: "Category không tìm thấy" });
    }

    res.status(200).json({ message: "Đã xóa category và toàn bộ sách liên quan" });
  } catch (error) {
    console.error("Lỗi khi xóa category và sách:", error);
    res.status(500).json({ error: "Lỗi server khi xóa category" });
  }
};

const getBooksByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.query;

    const query = { category: id };

    if (typeof is_active !== "undefined") {
      query.is_active = is_active === "true";
    }

    const books = await Book.find(query)
      .populate("category", "name")
      .sort({ created_at: -1 });

    res.status(200).json({ success: true, books });
  } catch (err) {
    console.error("Lỗi lấy sách theo thể loại:", err);
    res.status(500).json({ message: "Lỗi server khi lấy sách theo thể loại." });
  }
};

module.exports = {
  createCategory,
  deleteCategory,
  getAllCategories,
  getBooksByCategory,
};
