// http://localhost:5000/report/

const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.js");
const isAdmin = require("../middlewares/role.middleware");
const auth = require("../middlewares/auth.middleware");

router.get("/overview", auth, isAdmin, reportController.getOverview);
router.get(
  "/books-by-category",
  auth,
  isAdmin,
  reportController.getBooksByCategoryStats
);
router.get("/comments-wmy", auth, isAdmin, reportController.getComment_wmy);
router.get("/new-users-wmy", auth, isAdmin, reportController.getNewUsers_wmy);

module.exports = router;
