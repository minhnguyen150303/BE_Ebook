//

const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const { toggleFavorite, getFavorites } = require("../controllers/favorite");

//thêm/ bỏ yêu thích
router.post("/toggle/:bookId", auth, toggleFavorite);
router.get("/", auth, getFavorites);

module.exports = router;
