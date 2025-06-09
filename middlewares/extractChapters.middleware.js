const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const textract = require("textract");

const extractChapters = async (req, res, next) => {
  try {
    const fileArray = req.files?.file_url;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ message: "Không có file sách (file_url)" });
    }

    const filePath = fileArray[0].path;
    const ext = path.extname(filePath).toLowerCase();
    let fullText = "";

    // Đọc file
    if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      fullText = data.text;
    } else if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      fullText = result.value;
    } else if (ext === ".doc") {
      fullText = await new Promise((resolve, reject) => {
        textract.fromFileWithPath(filePath, (error, text) => {
          if (error) reject(error);
          else resolve(text);
        });
      });
    } else {
      return res.status(400).json({ message: "Định dạng không hỗ trợ!" });
    }

    // Regex bắt chương: lấy tên và vị trí
    const chapterRegex = /(chương|CHƯƠNG|Chương)\s+(\d+)[\.: \-–]*(.*)?/g;
    const matches = [];
    let match;

    while ((match = chapterRegex.exec(fullText)) !== null) {
      matches.push({
        index: match.index,
        number: parseInt(match[2]),
        rawTitle: match[0].trim(),
      });
    }

    const chapters = [];

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = matches[i + 1] ? matches[i + 1].index : fullText.length;

      const full = fullText.substring(start, end).trim();
      const lines = full
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const title = lines[0]; // Dòng tiêu đề đầu tiên
      const content = lines.slice(1).join("\n").trim(); // Phần sau

      chapters.push({
        chapter_number: i + 1,
        title,
        content,
      });
    }

    req.chapters = chapters;
    next();
  } catch (error) {
    console.error("Lỗi tách chương:", error);
    res.status(500).json({ message: "Lỗi khi tách chương từ tài liệu" });
  }
};

module.exports = extractChapters;
