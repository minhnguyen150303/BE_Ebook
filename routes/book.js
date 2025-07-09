// http://localhost:5000/book/

const express = require("express");
const router = express.Router();
const {
  uploadFields,
  // uploadDocument,
  uploadBookCover,
} = require("../middlewares/upload.middleware");
const extractChapters = require("../middlewares/extractChapters.middleware");
const bookController = require("../controllers/book.js");
const isAdmin = require("../middlewares/role.middleware");
const auth = require("../middlewares/auth.middleware");

router.post(
  "/create-book",
  auth,
  isAdmin,
  uploadFields.fields([
    { name: "cover_url", maxCount: 1 },
    { name: "file_url", maxCount: 1 },
  ]),
  extractChapters,
  bookController.createBook
);

router.get("/get-all", bookController.getAllBooks);
//admin dùng thôi
router.get("/get-book-lock", auth, isAdmin, bookController.getBookLock);
router.get("/get-detail/:id", bookController.getBookById);
//admin dùng thôi
router.get("/get-all-detail/:id", auth, isAdmin, bookController.getAllBookById);
router.get("/menu/:id", bookController.getChaptersByBook);
router.get(
  "/chapter/:bookId/:chapter_number",
  bookController.getChapterContent
);

// router.patch(
//   "/update-book/:id",
//   auth,
//   isAdmin,
//   uploadDocument.single("file_url"),
//   extractChapters,
//   bookController.updateFile
// );
router.patch(
  "/update-cover/:id",
  auth,
  isAdmin,
  uploadBookCover.single("cover_url"),
  bookController.updateCover
);
router.get("/no-view/:id", bookController.getBookByIdNoView);
router.patch("/status/:id", auth, isAdmin, bookController.toggleBookStatus);
router.delete("/delete/:id", auth, isAdmin, bookController.deleteBook);
router.get("/category/:categoryId", bookController.getBooksByCategory);
//ds sách có lượt view cao nhất
router.get("/top-view", bookController.getTopViewedBooks);

module.exports = router;
