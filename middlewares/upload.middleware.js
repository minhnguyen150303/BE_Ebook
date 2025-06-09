// middlewares/upload.middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const getStorage = (folderName) => {
  const uploadDir = path.join(__dirname, `../uploads/${folderName}`);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, filename);
    },
  });
};

const imageFilter = (req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Chỉ cho phép ảnh JPG, PNG"), false);
};

const documentFilter = (req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error("Chỉ cho phép tài liệu PDF, DOC, DOCX"), false);
};

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "cover_url") {
    // Chỉ cho phép ảnh JPG, JPEG, PNG
    if ([".jpg", ".jpeg", ".png"].includes(ext)) cb(null, true);
    else cb(new Error("Chỉ cho phép ảnh JPG, JPEG, PNG"), false);
  } else if (file.fieldname === "file_url") {
    // Chỉ cho phép tài liệu PDF, DOC, DOCX
    if ([".pdf", ".doc", ".docx"].includes(ext)) cb(null, true);
    else cb(new Error("Chỉ cho phép tài liệu PDF, DOC, DOCX"), false);
  } else {
    // Không chấp nhận bất kỳ field nào khác
    cb(new Error("Field không hợp lệ"), false);
  }
};

const uploadFields = multer({
  storage: getStorage("books"),
  fileFilter: fileFilter,
});

const uploadAvatar = multer({ storage: getStorage("avatars"), imageFilter });
const uploadBookCover = multer({ storage: getStorage("books"), imageFilter });
const uploadDocument = multer({
  storage: getStorage("documents"),
  fileFilter: documentFilter,
});

module.exports = {
  uploadAvatar,
  uploadBookCover,
  uploadDocument,
  uploadFields,
};
