// http://localhost:5000/comment/

const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const isAdmin = require("../middlewares/role.middleware");
const commentController = require("../controllers/comment");

router.post("/", auth, commentController.createComment);
router.get("/book/:bookId", auth, commentController.getCommentsByBook);
router.patch("/update/:id", auth, commentController.updateComment);
router.patch("/toggle/:id", auth, isAdmin, commentController.toggleComment);
router.delete("/delete/:id", auth, commentController.deleteComment);

module.exports = router;
