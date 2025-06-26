const Category = require("../models/category");
const Book = require("../models/book");

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
const deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Category không tìm thấy" });
    }
    res.status(200).json({ message: "Category đã xóa" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
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
