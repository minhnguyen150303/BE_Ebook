// http://localhost:5000/category/

const express = require("express");
const router = express.Router();
const {
  createCategory,
  deleteCategory,
  getAllCategories,
} = require("../controllers/category.js");

router.post("/", createCategory);
router.get("/", getAllCategories);
router.delete("/:id", deleteCategory);

module.exports = router;
