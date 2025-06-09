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

router.get("/get-detail/:id", bookController.getBookById);

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

router.patch("/status/:id", auth, isAdmin, bookController.toggleBookStatus);
router.delete("/delete/:id", auth, isAdmin, bookController.deleteBook);

module.exports = router;
