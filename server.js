require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = "qwen/qwen3.8-27b";

const upload = multer({
  storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    });

    app.get("/", (req, res) => {
      res.sendFile(path.join(__dirname, "index.html"));
      });

      app.post("/api/analyze", upload.single("image"), async (req, res) => {
        try {
            if (!req.file) {
                  return res.status(400).json({ error: "Please select an image first." });
                      }
                          if (!process.env.GROQ_API_KEY) {
                                return res.status(500).json({ error: "Server key missing." });
                                    }
                                        if (req.file.size > 3 * 1024 * 1024) {
                                              return res.status(413).json({ error: "Image too large. Please use a photo under 3 MB." });
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
                                                                                                                                                                                                                                                                                                                                                                        console.error("Groq error:", response.status, JSON.stringify(data));
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

                                                                                                                                                                                                                                                                                                                                                                                                                  app.listen(PORT, "0.0.0.0", () => {
                                                                                                                                                                                                                                                                                                                                                                                                                    console.log(`NatureSnap AI server running on port ${PORT}`);
                                                                                                                                                                                                                                                                                                                                                                                                                    });