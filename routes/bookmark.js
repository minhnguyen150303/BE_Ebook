//
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const bookmarkController = require("../controllers/bookmark");

router.patch("/:bookId", auth, bookmarkController.saveOrUpdateBookmark);
router.get("/:bookId", auth, bookmarkController.getBookmark);

module.exports = router;
