const Book = require("../models/book");
const BookChapter = require("../models/bookChapter");
const fs = require("fs");
const createBook = async (req, res) => {
  try {
    const { title, author, description, category } = req.body;

    const cover = req.files?.cover_url?.[0];
    const file = req.files?.file_url?.[0];

    let cover_url = "";
    let file_url = "";

    if (cover) {
      cover_url = `http://localhost:5000/uploads/books/${cover.filename}`;
    }

    if (file) {
      file_url = `http://localhost:5000/uploads/books/${file.filename}`;
    }

    const newBook = new Book({
      title,
      author,
      description,
      cover_url,
      file_url,
      category,
      has_chapters: Array.isArray(req.chapters) && req.chapters.length > 0,
    });

    const savedBook = await newBook.save();

    // Lưu các chương (loại bỏ chương trùng)
    if (req.chapters?.length) {
      const uniqueMap = new Map();
      req.chapters.forEach((chap) => {
        if (!uniqueMap.has(chap.chapter_number)) {
          uniqueMap.set(chap.chapter_number, chap);
        } else {
          console.warn(`⚠️ Bỏ qua chương trùng số: ${chap.chapter_number}`);
        }
      });

      const chapterDocs = Array.from(uniqueMap.values()).map((chap) => ({
        ...chap,
        book: savedBook._id,
      }));

      if (chapterDocs.length > 0) {
        await BookChapter.insertMany(chapterDocs);
      }
    }

    res.status(201).json({
      success: true,
      message: "Tạo sách thành công",
      book: savedBook,
    });
  } catch (error) {
    console.error("Lỗi tạo sách:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy danh sách chương theo sách
const getChaptersByBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Không tìm thấy sách" });
    const chapters = await BookChapter.find({ book: book._id })
      .sort("chapter_number")
      .select("-content");
    res.status(200).json({ success: true, chapters });
  } catch (error) {
    console.error("Lỗi lấy danh sách chương:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Xem nội dung chương cụ thể theo chapter_number và bookId
const getChapterContent = async (req, res) => {
  try {
    const { bookId, chapter_number } = req.params;
    const chapterNumber = Number(chapter_number);
    if (isNaN(chapterNumber)) {
      return res.status(400).json({ message: "Số chương không hợp lệ" });
    }

    const chapter = await BookChapter.findOne({
      book: bookId,
      chapter_number: parseInt(chapterNumber),
    });
    if (!chapter)
      return res.status(404).json({ message: "Không tìm thấy chương" });

    res.status(200).json({ success: true, chapter });
  } catch (error) {
    console.error("Lỗi xem nội dung chương:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getAllBooks = async (req, res) => {
  try {
    const books = await Book.find({ is_active: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      books,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách sách:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách sách" });
  }
};

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await Book.findById(id);

    // Tăng lượt xem
    await Book.findByIdAndUpdate(id, { $inc: { views: 1 } });

    if (!book || !book.is_active) {
      return res.status(404).json({ message: "Không tìm thấy sách" });
    }

    res.status(200).json({
      success: true,
      book,
    });
  } catch (error) {
    console.error("Lỗi lấy sách theo ID:", error);
    res.status(500).json({ message: "Lỗi server khi lấy sách theo ID" });
  }
};
const updateCover = async (req, res) => {
  try {
    const { id } = req.params;
    const cover = req.file;

    if (!cover) {
      return res.status(400).json({ message: "Chưa upload ảnh bìa mới." });
    }

    const updated = await Book.findByIdAndUpdate(
      id,
      { cover_url: `http://localhost:5000/uploads/avatars/${cover.filename}` },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sách để cập nhật ảnh bìa." });
    }

    res.json({
      success: true,
      message: "Cập nhật ảnh bìa thành công",
      book: updated,
    });
  } catch (error) {
    console.error("Lỗi cập nhật ảnh bìa:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

//xóa mềm
const toggleBookStatus = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(400).json({ message: "Không tìm thấy sách" });

    book.is_active = !book.is_active;
    await book.save();

    res.status(200).json({
      message: "Đã cập nhật trạng thái sách",
      is_active: book.is_active,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái sách" });
  }
};

// Xóa cứng sách và toàn bộ chương, file ảnh, file sách
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Không tìm thấy sách" });

    // Xóa file ảnh bìa và file sách khỏi ổ đĩa
    const deleteFileIfExists = (filePath) => {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    };

    deleteFileIfExists(book.cover_url);
    deleteFileIfExists(book.file_url);

    // Xóa các chương
    await BookChapter.deleteMany({ book: book._id });

    // Xóa sách
    await Book.findByIdAndDelete(book._id);

    res
      .status(200)
      .json({ success: true, message: "Đã xóa hoàn toàn sách và các chương" });
  } catch (error) {
    console.error("Lỗi xóa cứng sách:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  getChaptersByBook,
  getChapterContent,
  updateCover,
  toggleBookStatus,
  deleteBook,
};
