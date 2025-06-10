const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const authRoutes = require("./routes/auth.js");
const bookRoutes = require("./routes/book");
const categoryRoutes = require("./routes/category");
const bookmarkRoutes = require("./routes/bookmark");
const favoriteRoutes = require("./routes/favorite");
const commentRoutes = require("./routes/comment");
const cors = require("cors");
const path = require("path");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);
app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  console.log("client connected", socket.id);

  socket.on("join-book", (book) => {
    socket.join(book);
    console.log(`📚 Client ${socket.id} đã vào phòng sách ${book}`);
  });

  socket.on("disconnect", () => {
    console.log("client disconnected", socket.id);
  });
});

app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/book", bookRoutes);
app.use("/category", categoryRoutes);
app.use("/bookmark", bookmarkRoutes);
app.use("/favorite", favoriteRoutes);
app.use("/comment", commentRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));
