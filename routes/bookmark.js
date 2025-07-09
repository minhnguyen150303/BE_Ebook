// http://localhost:5000/bookmark/
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const bookmarkController = require("../controllers/bookmark");

router.patch("/:bookId", auth, bookmarkController.saveOrUpdateBookmark);
router.delete("/:bookId", auth, bookmarkController.deleteBookmark);
router.get("/:bookId", auth, bookmarkController.getBookmark);
router.get("/", auth, bookmarkController.getAllBookmarks);

module.exports = router;
