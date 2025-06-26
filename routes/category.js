// http://localhost:5000/category/

const express = require("express");
const auth = require("../middlewares/auth.middleware.js");
const isAdmin = require("../middlewares/role.middleware");
const router = express.Router();
const {
  createCategory,
  deleteCategory,
  getAllCategories,
  getBooksByCategory,
} = require("../controllers/category.js");

router.post("/", auth, isAdmin, createCategory);
router.get("/", getAllCategories);
router.delete("/:id", auth, isAdmin, deleteCategory);
//admin dùng thôi
router.get("/get-books/:id", auth, isAdmin, getBooksByCategory);
module.exports = router;
