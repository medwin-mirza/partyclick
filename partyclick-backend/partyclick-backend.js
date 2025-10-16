// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ImageKit from "imagekit";

dotenv.config();

const app = express();
app.use(cors());
// Increase JSON body limit to handle base64 images
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Initialize ImageKit SDK with server-side private key
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Route to handle client-side image uploads
app.post("/upload", async (req, res) => {
  try {
    const { file, fileName } = req.body; // file = base64 string from frontend

    const result = await imagekit.upload({
      file,
      fileName,
      folder: "/engagement-photos",
      useUniqueFileName: true,
      tags: ["party", "guest-upload"],
    });

    res.json({ url: result.url });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
