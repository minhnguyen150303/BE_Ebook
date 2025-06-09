const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const authRoutes = require("./routes/auth.js");
const bookRoutes = require("./routes/book");
const categoryRoutes = require("./routes/category");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/book", bookRoutes);
app.use("/category", categoryRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));
