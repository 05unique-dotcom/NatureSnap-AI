require("dotenv").config();

const express = require("express");
const multer = require("multer");
const path = require("path");
const { InferenceClient } = require("@huggingface/inference");

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
          const allowed = ["image/jpeg", "image/png", "image/webp"];
              if (allowed.includes(file.mimetype)) {
                    cb(null, true);
                        } else {
                              cb(new Error("Please upload a JPG, PNG, or WEBP image."));
                                  }
                                    }
                                    });

                                    const hf = new InferenceClient(process.env.HF_TOKEN);

                                    app.use(express.static(__dirname));

                                    app.post("/api/analyze", upload.single("image"), async (req, res) => {
                                      try {
                                          if (!process.env.HF_TOKEN) {
                                                return res.status(500).json({
                                                        error: "Server token is not configured."
                                                              });
                                                                  }

                                                                      if (!req.file) {
                                                                            return res.status(400).json({
                                                                                    error: "Please select an image first."
                                                                                          });
                                                                                              }

                                                                                                  const base64 = req.file.buffer.toString("base64");
                                                                                                      const imageUrl = `data:${req.file.mimetype};base64,${base64}`;

                                                                                                          const result = await hf.chatCompletion({
                                                                                                                model: "Qwen/Qwen2.5-VL-7B-Instruct",
                                                                                                                      messages: [
                                                                                                                              {
                                                                                                                                        role: "user",
                                                                                                                                                  content: [
                                                                                                                                                              {
                                                                                                                                                                            type: "text",
                                                                                                                                                                                          text: "You are NatureSnap AI. Analyze this nature photo. Identify the visible plant, animal, or natural object if possible. Give a likely name, three interesting facts, and one safe nature observation challenge. If uncertain, clearly say so. Never recommend touching or eating unknown plants or animals. Use simple English and clear headings."
                                                                                                                                                                                                      },
                                                                                                                                                                                                                  {
                                                                                                                                                                                                                                type: "image_url",
                                                                                                                                                                                                                                              image_url: { url: imageUrl }
                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                    ]
                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                  ],
                                                                                                                                                                                                                                                                                        max_tokens: 350
                                                                                                                                                                                                                                                                                            });

                                                                                                                                                                                                                                                                                                res.json({
                                                                                                                                                                                                                                                                                                      analysis: result.choices?.[0]?.message?.content ||
                                                                                                                                                                                                                                                                                                              "Sorry, no analysis was returned."
                                                                                                                                                                                                                                                                                                                  });
                                                                                                                                                                                                                                                                                                                    } catch (error) {
      console.error("Analysis request failed:", error.message, require("util").inspect(error.httpResponse || error.cause || error, { depth: 3 }));
                                                                                                                                                                                                                                                                                                                            res.status(500).json({
                                                                                                                                                                                                                                                                                                                                  error: "AI analysis failed. Please try again later."
                                                                                                                                                                                                                                                                                                                                      });
                                                                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                                                                        });

                                                                                                                                                                                                                                                                                                                                        app.use((err, req, res, next) => {
                                                                                                                                                                                                                                                                                                                                          if (err instanceof multer.MulterError) {
                                                                                                                                                                                                                                                                                                                                              return res.status(400).json({
                                                                                                                                                                                                                                                                                                                                                    error: "Image is too large. Maximum size is 5 MB."
                                                                                                                                                                                                                                                                                                                                                        });
                                                                                                                                                                                                                                                                                                                                                          }

                                                                                                                                                                                                                                                                                                                                                            if (err) {
                                                                                                                                                                                                                                                                                                                                                                return res.status(400).json({ error: err.message });
                                                                                                                                                                                                                                                                                                                                                                  }

                                                                                                                                                                                                                                                                                                                                                                    next();
                                                                                                                                                                                                                                                                                                                                                                    });

                                                                                                                                                                                                                                                                                                                                                                    app.listen(PORT, "0.0.0.0", () => {
                                                                                                                                                                                                                                                                                                                                                                      console.log(`NatureSnap AI server running on port ${PORT}`);
                                                                                                                                                                                                                                                                                                                                                                      });
                                                                                                                                                                                                                                                                                                                