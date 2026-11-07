require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = "qwen/qwen3.8-27b";
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      const error = new Error("INVALID_FILE_TYPE");
      error.code = "INVALID_FILE_TYPE";
      return callback(error);
    }
    callback(null, true);
  },
});

const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many analysis requests. Please try again later." },
});

function hasValidImageSignature(buffer, mimetype) {
  if (mimetype === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === "image/png") {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (mimetype === "image/gif") {
    return buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"));
  }
  if (mimetype === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

app.use(helmet({ contentSecurityPolicy: false }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/analyze", analyzeLimiter, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please select an image first." });
    }
    if (!hasValidImageSignature(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({ error: "Please upload a valid JPG, PNG, GIF, or WebP image." });
    }
    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "Server key missing." });
    }

    const base64 = req.file.buffer.toString("base64");
    const imageUrl = "data:" + req.file.mimetype + ";base64," + base64;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Identify the plant, flower, bird, animal or natural object in this photo. " +
                  "Give: 1) Name (common and scientific if known), 2) Three short interesting facts, " +
                  "3) One simple outdoor activity related to it. Keep it friendly and short. " +
                  "If the photo has no nature subject, say so politely.",
              },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq request failed with status", response.status);
      return res.status(502).json({ error: "AI analysis failed. Please try again later." });
    }

    const text = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : "";
    res.json({ analysis: text || "No answer received." });
  } catch (error) {
    console.error("Analysis request failed:", error.message);
    res.status(500).json({ error: "AI analysis failed. Please try again later." });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "Image too large. Please use a photo under 3 MB." });
  }
  if (error && error.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({ error: "Please upload a valid JPG, PNG, GIF, or WebP image." });
  }
  if (error) {
    console.error("Upload request failed:", error.message);
    return res.status(400).json({ error: "The image upload could not be processed." });
  }
  next();
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`NatureSnap AI server running on port ${PORT}`);
});
